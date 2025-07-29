"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = exports.VerificationStatus = exports.VerificationType = void 0;
const uuid_1 = require("uuid");
const database_config_1 = require("../config/database.config");
const redis_config_1 = require("../config/redis.config");
const logger_1 = require("../utils/logger");
const email_service_1 = require("./email.service");
const phone_verification_service_1 = require("./phone-verification.service");
var VerificationType;
(function (VerificationType) {
    VerificationType["EMAIL"] = "EMAIL";
    VerificationType["PHONE"] = "PHONE";
    VerificationType["PASSWORD_RESET"] = "PASSWORD_RESET";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["EXPIRED"] = "EXPIRED";
    VerificationStatus["FAILED"] = "FAILED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
class VerificationService {
    pool;
    redis;
    emailService;
    phoneVerificationService;
    constructor() {
        this.pool = database_config_1.DatabaseConfig.getInstance().getPool();
        this.redis = redis_config_1.RedisConfig.getInstance().getClient();
        this.emailService = new email_service_1.EmailService();
        this.phoneVerificationService = new phone_verification_service_1.PhoneVerificationService();
    }
    /**
     * Send verification code/link
     */
    async sendVerification(request) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Check rate limits
            const rateLimit = await this.checkRateLimit(request.userId, request.ipAddress, request.type, request.targetValue);
            if (!rateLimit.allowed) {
                logger_1.SAMALogger.logSecurityEvent('VERIFICATION_RATE_LIMIT_EXCEEDED', 'MEDIUM', {
                    userId: request.userId,
                    type: request.type,
                    targetValue: request.targetValue,
                    reason: rateLimit.reason
                });
                throw new Error(`Rate limit exceeded: ${rateLimit.reason}`);
            }
            // Clean up any existing pending verification for this user/type/target
            await this.cleanupPendingVerifications(request.userId, request.type, request.targetValue);
            // Generate verification token and code
            const token = this.generateSecureToken();
            const code = request.type === VerificationType.PHONE ? this.generateOTPCode() : undefined;
            // Calculate expiry (15 minutes for phone, 24 hours for email)
            const expiryMinutes = request.type === VerificationType.PHONE ? 15 : 1440;
            const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
            // Store verification token
            const insertTokenQuery = `
        INSERT INTO verification_tokens (
          user_id, verification_type, token, code, target_value, 
          expires_at, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
            const tokenResult = await client.query(insertTokenQuery, [
                request.userId,
                request.type,
                token,
                code,
                request.targetValue,
                expiresAt,
                request.ipAddress,
                request.userAgent
            ]);
            const tokenId = tokenResult.rows[0].id;
            // Log attempt
            await this.logVerificationAttempt(tokenId, request.userId, 'SEND', true, undefined, request.ipAddress, request.userAgent);
            await client.query('COMMIT');
            // Send verification message
            let sendResult = { success: false, message: '' };
            if (request.type === VerificationType.EMAIL) {
                sendResult = await this.emailService.sendVerificationEmail(request.targetValue, token, request.userId);
            }
            else if (request.type === VerificationType.PHONE) {
                await this.phoneVerificationService.sendOTP(request.targetValue, request.userId);
                sendResult = { success: true, message: 'Phone OTP sent successfully' };
            }
            // Log SAMA compliance event
            logger_1.SAMALogger.logAuthEvent('VERIFICATION_SENT', request.userId, {
                type: request.type,
                targetValue: request.targetValue,
                tokenId,
                success: sendResult.success
            });
            if (!sendResult.success) {
                throw new Error(sendResult.message);
            }
            return {
                success: true,
                message: this.getSuccessMessage(request.type)
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Send verification failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Verify code or token
     */
    async verifyCode(request) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Find verification token
            const findTokenQuery = `
        SELECT * FROM verification_tokens 
        WHERE user_id = $1 
          AND status = 'PENDING' 
          AND expires_at > CURRENT_TIMESTAMP
          AND (token = $2 OR code = $3)
        ORDER BY created_at DESC
        LIMIT 1
      `;
            const tokenResult = await client.query(findTokenQuery, [
                request.userId,
                request.token,
                request.code
            ]);
            if (tokenResult.rows.length === 0) {
                await this.logVerificationAttempt(null, request.userId, 'VERIFY', false, 'Token not found or expired', request.ipAddress, request.userAgent);
                logger_1.SAMALogger.logSecurityEvent('VERIFICATION_INVALID_TOKEN', 'MEDIUM', {
                    userId: request.userId,
                    providedToken: request.token,
                    providedCode: request.code
                });
                throw new Error('Invalid or expired verification code');
            }
            const verificationToken = tokenResult.rows[0];
            // Check if max attempts exceeded
            if (verificationToken.attempts >= verificationToken.max_attempts) {
                await client.query('UPDATE verification_tokens SET status = $1 WHERE id = $2', [VerificationStatus.FAILED, verificationToken.id]);
                await this.logVerificationAttempt(verificationToken.id, request.userId, 'VERIFY', false, 'Max attempts exceeded', request.ipAddress, request.userAgent);
                logger_1.SAMALogger.logSecurityEvent('VERIFICATION_MAX_ATTEMPTS_EXCEEDED', 'HIGH', {
                    userId: request.userId,
                    tokenId: verificationToken.id,
                    attempts: verificationToken.attempts
                });
                throw new Error('Maximum verification attempts exceeded');
            }
            // Verify the code/token
            const isValid = request.token
                ? request.token === verificationToken.token
                : request.code === verificationToken.code;
            if (!isValid) {
                // Increment attempts
                await client.query('UPDATE verification_tokens SET attempts = attempts + 1 WHERE id = $1', [verificationToken.id]);
                await this.logVerificationAttempt(verificationToken.id, request.userId, 'VERIFY', false, 'Invalid code/token', request.ipAddress, request.userAgent);
                logger_1.SAMALogger.logSecurityEvent('VERIFICATION_INVALID_CODE', 'MEDIUM', {
                    userId: request.userId,
                    tokenId: verificationToken.id,
                    attempts: verificationToken.attempts + 1
                });
                throw new Error('Invalid verification code');
            }
            // Mark as verified
            await client.query('UPDATE verification_tokens SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE id = $2', [VerificationStatus.VERIFIED, verificationToken.id]);
            // Update user verification status
            if (verificationToken.verification_type === VerificationType.EMAIL) {
                await client.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [request.userId]);
            }
            else if (verificationToken.verification_type === VerificationType.PHONE) {
                await client.query('UPDATE users SET phone_verified = TRUE WHERE id = $1', [request.userId]);
            }
            await this.logVerificationAttempt(verificationToken.id, request.userId, 'VERIFY', true, undefined, request.ipAddress, request.userAgent);
            await client.query('COMMIT');
            // Log SAMA compliance event
            logger_1.SAMALogger.logAuthEvent('VERIFICATION_COMPLETED', request.userId, {
                type: verificationToken.verification_type,
                targetValue: verificationToken.target_value,
                tokenId: verificationToken.id
            });
            // Clear cache
            await this.clearUserVerificationCache(request.userId);
            return {
                success: true,
                message: this.getVerificationSuccessMessage(verificationToken.verification_type)
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Verify code failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Resend verification
     */
    async resendVerification(userId, type, ipAddress, userAgent) {
        // Get user's email/phone for the type
        const getUserQuery = 'SELECT email, phone FROM users WHERE id = $1';
        const userResult = await this.pool.query(getUserQuery, [userId]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const user = userResult.rows[0];
        const targetValue = type === VerificationType.EMAIL ? user.email : user.phone;
        if (!targetValue) {
            throw new Error(`${type.toLowerCase()} not available for verification`);
        }
        return this.sendVerification({
            userId,
            type,
            targetValue,
            ipAddress,
            userAgent
        });
    }
    /**
     * Check verification status
     */
    async getVerificationStatus(userId) {
        const cached = await this.getUserVerificationCache(userId);
        if (cached)
            return cached;
        const getUserQuery = 'SELECT email_verified, phone_verified FROM users WHERE id = $1';
        const result = await this.pool.query(getUserQuery, [userId]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        const status = {
            emailVerified: result.rows[0].email_verified,
            phoneVerified: result.rows[0].phone_verified
        };
        await this.cacheUserVerificationStatus(userId, status);
        return status;
    }
    async checkRateLimit(userId, ipAddress, type, targetValue) {
        const checkQuery = `
      SELECT * FROM verification_rate_limits 
      WHERE (user_id = $1 OR ip_address = $2) 
        AND verification_type = $3 
        AND target_value = $4
    `;
        const result = await this.pool.query(checkQuery, [userId, ipAddress, type, targetValue]);
        if (result.rows.length === 0) {
            // Create new rate limit record
            await this.pool.query('INSERT INTO verification_rate_limits (user_id, ip_address, verification_type, target_value) VALUES ($1, $2, $3, $4)', [userId, ipAddress, type, targetValue]);
            return { allowed: true };
        }
        const rateLimitRecord = result.rows[0];
        const maxRequests = 5;
        const windowMinutes = 60;
        // Check if blocked
        if (rateLimitRecord.blocked_until && new Date(rateLimitRecord.blocked_until) > new Date()) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded',
                resetTime: new Date(rateLimitRecord.blocked_until)
            };
        }
        // Check if within window
        const windowStart = new Date(rateLimitRecord.window_start);
        const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
        if (new Date() < windowEnd) {
            if (rateLimitRecord.request_count >= maxRequests) {
                // Block for 1 hour
                const blockedUntil = new Date(Date.now() + 60 * 60 * 1000);
                await this.pool.query('UPDATE verification_rate_limits SET blocked_until = $1 WHERE id = $2', [blockedUntil, rateLimitRecord.id]);
                return {
                    allowed: false,
                    reason: 'Rate limit exceeded',
                    resetTime: blockedUntil
                };
            }
            // Increment counter
            await this.pool.query('UPDATE verification_rate_limits SET request_count = request_count + 1 WHERE id = $1', [rateLimitRecord.id]);
        }
        else {
            // Reset window
            await this.pool.query('UPDATE verification_rate_limits SET request_count = 1, window_start = CURRENT_TIMESTAMP, blocked_until = NULL WHERE id = $1', [rateLimitRecord.id]);
        }
        return { allowed: true };
    }
    async cleanupPendingVerifications(userId, type, targetValue) {
        await this.pool.query('UPDATE verification_tokens SET status = $1 WHERE user_id = $2 AND verification_type = $3 AND target_value = $4 AND status = $5', [VerificationStatus.EXPIRED, userId, type, targetValue, VerificationStatus.PENDING]);
    }
    async logVerificationAttempt(tokenId, userId, attemptType, success, errorMessage, ipAddress, userAgent) {
        try {
            await this.pool.query('INSERT INTO verification_attempts (verification_token_id, user_id, attempt_type, success, error_message, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)', [tokenId, userId, attemptType, success, errorMessage, ipAddress, userAgent]);
        }
        catch (error) {
            logger_1.logger.error('Failed to log verification attempt:', error);
        }
    }
    generateSecureToken() {
        return (0, uuid_1.v4)().replace(/-/g, '');
    }
    generateOTPCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    getSuccessMessage(type) {
        switch (type) {
            case VerificationType.EMAIL:
                return 'Verification email sent successfully';
            case VerificationType.PHONE:
                return 'Verification code sent to your phone';
            default:
                return 'Verification sent successfully';
        }
    }
    getVerificationSuccessMessage(type) {
        switch (type) {
            case VerificationType.EMAIL:
                return 'Email verified successfully';
            case VerificationType.PHONE:
                return 'Phone number verified successfully';
            default:
                return 'Verification completed successfully';
        }
    }
    async cacheUserVerificationStatus(userId, status) {
        const key = `user_verification:${userId}`;
        await this.redis.setex(key, 3600, JSON.stringify(status));
    }
    async getUserVerificationCache(userId) {
        const key = `user_verification:${userId}`;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async clearUserVerificationCache(userId) {
        const key = `user_verification:${userId}`;
        await this.redis.del(key);
    }
}
exports.VerificationService = VerificationService;
//# sourceMappingURL=verification.service.js.map