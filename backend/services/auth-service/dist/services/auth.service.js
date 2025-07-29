"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const auth_types_1 = require("../types/auth.types");
const database_config_1 = require("../config/database.config");
const redis_config_1 = require("../config/redis.config");
const password_utils_1 = require("../utils/password.utils");
const jwt_utils_1 = require("../utils/jwt.utils");
const validation_utils_1 = require("../utils/validation.utils");
const logger_1 = require("../utils/logger");
const environment_config_1 = require("../config/environment.config");
const mock_redis_1 = require("../utils/mock-redis");
class AuthService {
    pool;
    redis;
    constructor() {
        this.pool = database_config_1.DatabaseConfig.getInstance().getPool();
        this.redis = redis_config_1.RedisConfig.getInstance().getClient() || (0, mock_redis_1.createMockRedis)();
    }
    async register(data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Validate password strength
            const passwordValidation = password_utils_1.PasswordUtils.validate(data.password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }
            // Hash password
            const passwordHash = await password_utils_1.PasswordUtils.hash(data.password);
            // Normalize phone number if provided
            const normalizedPhone = data.phone ? validation_utils_1.ValidationUtils.normalizeSaudiPhone(data.phone) : null;
            // Check if phone is verified (required for registration)
            let phoneVerified = false;
            if (normalizedPhone) {
                const PhoneVerificationService = require('./phone-verification.service').PhoneVerificationService;
                const phoneVerificationService = new PhoneVerificationService();
                phoneVerified = await phoneVerificationService.isPhoneVerified(normalizedPhone);
                // For production, phone verification is mandatory
                if (!phoneVerified && environment_config_1.config.env === 'production') {
                    throw new Error('Phone verification required before registration');
                }
            }
            // Create user
            const createUserQuery = `
        INSERT INTO users (
          first_name, last_name, email, password_hash, phone, 
          role, provider, national_id, status, user_type, 
          bnpl_eligible, email_verified, phone_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
            const userResult = await client.query(createUserQuery, [
                data.first_name,
                data.last_name,
                data.email.toLowerCase(),
                passwordHash,
                normalizedPhone,
                data.role || auth_types_1.UserRole.USER,
                auth_types_1.AuthProvider.EMAIL,
                data.national_id,
                auth_types_1.UserStatus.PENDING,
                data.user_type || 'HOMEOWNER',
                false, // bnpl_eligible default to false (Beta V2 - requires admin approval)
                false, // email_verified  
                phoneVerified // phone_verified - true if phone was verified before registration
            ]);
            const user = userResult.rows[0];
            // Create session
            const sessionId = (0, uuid_1.v4)();
            const { accessToken, refreshToken, expiresIn } = jwt_utils_1.JWTUtils.generateTokenPair(user.id, user.email, user.role, sessionId);
            const createSessionQuery = `
        INSERT INTO user_sessions (id, user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4)
      `;
            const expiresAt = new Date(Date.now() + jwt_utils_1.JWTUtils.getExpiresInMs(environment_config_1.config.jwt.refreshTokenExpiresIn));
            await client.query(createSessionQuery, [sessionId, user.id, refreshToken, expiresAt]);
            await client.query('COMMIT');
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('USER_REGISTRATION', user.id, {
                role: user.role,
                provider: auth_types_1.AuthProvider.EMAIL
            });
            // Cache user data
            await this.cacheUserData(user.id, user);
            // Return tokens and user information
            return {
                accessToken,
                refreshToken,
                expiresIn,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    national_id: user.national_id,
                    user_type: user.user_type,
                    status: user.status,
                    bnpl_eligible: user.bnpl_eligible
                }
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof Error) {
                if (error.message.includes('duplicate key value violates unique constraint')) {
                    if (error.message.includes('users_email_key')) {
                        throw new Error('Email already registered');
                    }
                    if (error.message.includes('users_national_id_key')) {
                        throw new Error('National ID already registered');
                    }
                }
            }
            logger_1.logger.error('Registration failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async login(data) {
        const client = await this.pool.connect();
        try {
            // For email-based login, check if OTP was verified first
            if (data.email && this.redis) {
                const verifiedKey = `login_verified:${data.email.toLowerCase()}`;
                const isOTPVerified = await this.redis.get(verifiedKey);
                if (!isOTPVerified) {
                    throw new Error('OTP verification required before login');
                }
            }
            // Get user by email or phone
            let getUserQuery;
            let queryParam;
            if (data.email) {
                getUserQuery = `SELECT * FROM users WHERE email = $1`;
                queryParam = data.email.toLowerCase();
            }
            else if (data.phone) {
                // Normalize phone number for consistent lookup
                const normalizedPhone = validation_utils_1.ValidationUtils.normalizeSaudiPhone(data.phone);
                getUserQuery = `SELECT * FROM users WHERE phone = $1`;
                queryParam = normalizedPhone;
            }
            else {
                throw new Error('Either email or phone is required');
            }
            const userResult = await client.query(getUserQuery, [queryParam]);
            if (userResult.rows.length === 0) {
                const identifier = data.email || data.phone;
                logger_1.SAMALogger.logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', 'LOW', {
                    identifier,
                    loginType: data.email ? 'email' : 'phone'
                });
                throw new Error('Invalid credentials');
            }
            const user = userResult.rows[0];
            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                logger_1.SAMALogger.logSecurityEvent('LOGIN_ATTEMPT_LOCKED_ACCOUNT', 'MEDIUM', { userId: user.id });
                throw new Error('Account temporarily locked. Please try again later.');
            }
            // Verify password
            const isValidPassword = await password_utils_1.PasswordUtils.compare(data.password, user.password_hash);
            if (!isValidPassword) {
                // Increment login attempts
                await this.incrementLoginAttempts(user.id);
                logger_1.SAMALogger.logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', 'MEDIUM', { userId: user.id });
                throw new Error('Invalid credentials');
            }
            // Check user status
            if (user.status !== auth_types_1.UserStatus.ACTIVE && user.status !== auth_types_1.UserStatus.PENDING) {
                logger_1.SAMALogger.logSecurityEvent('LOGIN_FAILED_INACTIVE_ACCOUNT', 'MEDIUM', { userId: user.id, status: user.status });
                throw new Error('Account is not active');
            }
            // Reset login attempts on successful login
            await this.resetLoginAttempts(user.id);
            // Check if phone needs verification update (for existing users)
            if (user.phone && !user.phone_verified) {
                const PhoneVerificationService = require('./phone-verification.service').PhoneVerificationService;
                const phoneVerificationService = new PhoneVerificationService();
                const isVerified = await phoneVerificationService.isPhoneVerified(user.phone);
                if (isVerified) {
                    // Update phone verification status
                    await client.query('UPDATE users SET phone_verified = true, phone_verified_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
                    user.phone_verified = true;
                }
            }
            // Create session
            const sessionId = (0, uuid_1.v4)();
            const { accessToken, refreshToken, expiresIn } = jwt_utils_1.JWTUtils.generateTokenPair(user.id, user.email, user.role, sessionId);
            const createSessionQuery = `
        INSERT INTO user_sessions (id, user_id, refresh_token, device_id, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
            const expiresAt = new Date(Date.now() + jwt_utils_1.JWTUtils.getExpiresInMs(environment_config_1.config.jwt.refreshTokenExpiresIn));
            await client.query(createSessionQuery, [sessionId, user.id, refreshToken, data.deviceId, expiresAt]);
            // Update last login
            await client.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('USER_LOGIN', user.id, {
                deviceId: data.deviceId,
                provider: auth_types_1.AuthProvider.EMAIL
            });
            // Cache user data
            await this.cacheUserData(user.id, user);
            // Clean up login verification state for email-based login
            if (data.email && this.redis) {
                const verifiedKey = `login_verified:${data.email.toLowerCase()}`;
                await this.redis.del(verifiedKey);
            }
            return { accessToken, refreshToken, expiresIn };
        }
        finally {
            client.release();
        }
    }
    async refreshToken(refreshToken) {
        const client = await this.pool.connect();
        try {
            // Verify refresh token
            const payload = jwt_utils_1.JWTUtils.verifyRefreshToken(refreshToken);
            // Get session
            const getSessionQuery = `
        SELECT s.*, u.email, u.role, u.status
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.refresh_token = $1 AND s.expires_at > CURRENT_TIMESTAMP
      `;
            const sessionResult = await client.query(getSessionQuery, [refreshToken]);
            if (sessionResult.rows.length === 0) {
                logger_1.SAMALogger.logSecurityEvent('REFRESH_TOKEN_INVALID', 'MEDIUM', { sessionId: payload.sessionId });
                throw new Error('Invalid refresh token');
            }
            const session = sessionResult.rows[0];
            // Check user status
            if (session.status !== auth_types_1.UserStatus.ACTIVE && session.status !== auth_types_1.UserStatus.PENDING) {
                throw new Error('User account is not active');
            }
            // Generate new tokens
            const newSessionId = (0, uuid_1.v4)();
            const newTokens = jwt_utils_1.JWTUtils.generateTokenPair(session.user_id, session.email, session.role, newSessionId);
            // Update session
            await client.query('BEGIN');
            // Delete old session
            await client.query('DELETE FROM user_sessions WHERE id = $1', [session.id]);
            // Create new session
            const createSessionQuery = `
        INSERT INTO user_sessions (id, user_id, refresh_token, device_id, user_agent, ip_address, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
            const expiresAt = new Date(Date.now() + jwt_utils_1.JWTUtils.getExpiresInMs(environment_config_1.config.jwt.refreshTokenExpiresIn));
            await client.query(createSessionQuery, [
                newSessionId,
                session.user_id,
                newTokens.refreshToken,
                session.device_id,
                session.user_agent,
                session.ip_address,
                expiresAt
            ]);
            await client.query('COMMIT');
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('TOKEN_REFRESH', session.user_id, { sessionId: newSessionId });
            return newTokens;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async logout(userId, sessionId) {
        try {
            // Delete session
            await this.pool.query('DELETE FROM user_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
            // Clear cache
            await this.clearUserCache(userId);
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('USER_LOGOUT', userId, { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Logout failed:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        // Try cache first
        const cached = await this.getCachedUserData(userId);
        if (cached)
            return cached;
        // Get from database
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0)
            return null;
        const user = result.rows[0];
        // Cache for next time
        await this.cacheUserData(userId, user);
        return user;
    }
    async updateUserProfile(userId, updateData) {
        try {
            // Build dynamic update query
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            // Add fields to update
            Object.entries(updateData).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            });
            if (updateFields.length === 0) {
                return; // Nothing to update
            }
            // Add userId as the last parameter
            values.push(userId);
            const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;
            await this.pool.query(query, values);
            // Clear user cache so it gets refreshed next time
            await this.clearUserCache(userId);
            logger_1.logger.info('User profile updated successfully', { userId, fields: Object.keys(updateData) });
        }
        catch (error) {
            logger_1.logger.error('Failed to update user profile', error);
            throw error;
        }
    }
    async incrementLoginAttempts(userId) {
        const result = await this.pool.query('UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1 RETURNING login_attempts', [userId]);
        const attempts = result.rows[0].login_attempts;
        if (attempts >= environment_config_1.config.security.maxLoginAttempts) {
            const lockedUntil = new Date(Date.now() + environment_config_1.config.security.accountLockDurationMs);
            await this.pool.query('UPDATE users SET locked_until = $1 WHERE id = $2', [lockedUntil, userId]);
            logger_1.SAMALogger.logSecurityEvent('ACCOUNT_LOCKED_MAX_ATTEMPTS', 'HIGH', { userId, attempts });
        }
    }
    async resetLoginAttempts(userId) {
        await this.pool.query('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [userId]);
    }
    async cacheUserData(userId, userData) {
        if (!this.redis) {
            // Redis disabled in development mode
            return;
        }
        const key = `user:${userId}`;
        await this.redis.setex(key, 3600, JSON.stringify(userData));
    }
    async getCachedUserData(userId) {
        if (!this.redis) {
            // Redis disabled in development mode
            return null;
        }
        const key = `user:${userId}`;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async clearUserCache(userId) {
        if (!this.redis) {
            // Redis disabled in development mode
            return;
        }
        const key = `user:${userId}`;
        await this.redis.del(key);
    }
    // Phone number masking utility
    maskPhoneNumber(phone) {
        if (!phone)
            return '';
        // Remove country code for masking
        let localPhone = phone;
        if (phone.startsWith('+966')) {
            localPhone = phone.substring(4); // Remove +966
        }
        else if (phone.startsWith('+91')) {
            localPhone = phone.substring(3); // Remove +91
        }
        else if (phone.startsWith('+1')) {
            localPhone = phone.substring(2); // Remove +1
        }
        // Mask middle digits, show first 2 and last 4
        if (localPhone.length >= 6) {
            const first = localPhone.substring(0, 2);
            const last = localPhone.substring(localPhone.length - 4);
            const masked = '*'.repeat(localPhone.length - 6);
            return phone.substring(0, phone.length - localPhone.length) + first + masked + last;
        }
        return phone; // Return as is if too short
    }
    // Email-based login flow methods
    async lookupUserByEmail(email) {
        try {
            const getUserQuery = 'SELECT phone FROM users WHERE email = $1 AND phone IS NOT NULL';
            const result = await this.pool.query(getUserQuery, [email.toLowerCase()]);
            if (result.rows.length === 0) {
                return null;
            }
            const phone = result.rows[0].phone;
            return {
                phone,
                maskedPhone: this.maskPhoneNumber(phone)
            };
        }
        catch (error) {
            logger_1.logger.error('Email lookup error:', error);
            throw error;
        }
    }
    async sendLoginOTPByEmail(email) {
        try {
            // Get user's phone number
            const userLookup = await this.lookupUserByEmail(email);
            if (!userLookup) {
                return null; // User not found or no phone
            }
            // Send OTP to the user's registered phone
            const PhoneVerificationService = require('./phone-verification.service').PhoneVerificationService;
            const phoneVerificationService = new PhoneVerificationService();
            await phoneVerificationService.sendOTP(userLookup.phone);
            // Store email-OTP mapping in Redis for verification
            if (this.redis) {
                const emailOtpKey = `login_email_otp:${email.toLowerCase()}`;
                await this.redis.setex(emailOtpKey, 300, userLookup.phone); // 5 minutes
            }
            logger_1.SAMALogger.logAuthEvent('LOGIN_OTP_SENT_VIA_EMAIL', undefined, {
                email,
                maskedPhone: userLookup.maskedPhone
            });
            return { maskedPhone: userLookup.maskedPhone };
        }
        catch (error) {
            logger_1.logger.error('Send login OTP by email error:', error);
            throw error;
        }
    }
    async verifyLoginOTP(email, otp) {
        try {
            // Get phone number from Redis mapping
            let phoneNumber;
            if (this.redis) {
                const emailOtpKey = `login_email_otp:${email.toLowerCase()}`;
                phoneNumber = await this.redis.get(emailOtpKey);
                if (!phoneNumber) {
                    throw new Error('OTP verification session expired');
                }
            }
            else {
                // Fallback: lookup phone directly
                const userLookup = await this.lookupUserByEmail(email);
                if (!userLookup) {
                    throw new Error('User not found');
                }
                phoneNumber = userLookup.phone;
            }
            // Verify OTP using phone verification service
            const PhoneVerificationService = require('./phone-verification.service').PhoneVerificationService;
            const phoneVerificationService = new PhoneVerificationService();
            const isValid = await phoneVerificationService.verifyOTP(phoneNumber, otp);
            if (isValid && this.redis) {
                // Store verified state for login
                const verifiedKey = `login_verified:${email.toLowerCase()}`;
                await this.redis.setex(verifiedKey, 600, 'true'); // 10 minutes to complete login
                // Clean up email-OTP mapping
                const emailOtpKey = `login_email_otp:${email.toLowerCase()}`;
                await this.redis.del(emailOtpKey);
            }
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('Verify login OTP error:', error);
            throw error;
        }
    }
    async requestPasswordReset(email) {
        const client = await this.pool.connect();
        try {
            // Get user by email
            const getUserQuery = 'SELECT id, email FROM users WHERE email = $1';
            const userResult = await client.query(getUserQuery, [email.toLowerCase()]);
            if (userResult.rows.length === 0) {
                // Don't reveal if email exists or not for security
                logger_1.SAMALogger.logSecurityEvent('PASSWORD_RESET_REQUEST_UNKNOWN_EMAIL', 'LOW', { email });
                return;
            }
            const user = userResult.rows[0];
            // Generate reset token
            const resetToken = password_utils_1.PasswordUtils.generateSecureToken(32);
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry
            // Store reset token
            const insertTokenQuery = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `;
            await client.query(insertTokenQuery, [user.id, resetToken, expiresAt]);
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('PASSWORD_RESET_REQUESTED', user.id, {
                email: user.email,
                tokenExpiry: expiresAt.toISOString()
            });
            // In a real implementation, you would send email here
            // For now, we'll just log the token (remove in production)
            logger_1.logger.info(`Password reset token for ${email}: ${resetToken}`);
        }
        catch (error) {
            logger_1.logger.error('Password reset request failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async resetPassword(token, newPassword) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Validate new password
            const passwordValidation = password_utils_1.PasswordUtils.validate(newPassword);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }
            // Get reset token
            const getTokenQuery = `
        SELECT rt.*, u.email
        FROM password_reset_tokens rt
        JOIN users u ON u.id = rt.user_id
        WHERE rt.token = $1 AND rt.expires_at > CURRENT_TIMESTAMP AND rt.used = FALSE
      `;
            const tokenResult = await client.query(getTokenQuery, [token]);
            if (tokenResult.rows.length === 0) {
                logger_1.SAMALogger.logSecurityEvent('INVALID_PASSWORD_RESET_TOKEN', 'MEDIUM', { token });
                throw new Error('Invalid or expired reset token');
            }
            const resetData = tokenResult.rows[0];
            // Hash new password
            const passwordHash = await password_utils_1.PasswordUtils.hash(newPassword);
            // Update user password
            await client.query('UPDATE users SET password_hash = $1, login_attempts = 0, locked_until = NULL WHERE id = $2', [passwordHash, resetData.user_id]);
            // Mark token as used
            await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetData.id]);
            // Invalidate all user sessions
            await client.query('DELETE FROM user_sessions WHERE user_id = $1', [resetData.user_id]);
            await client.query('COMMIT');
            // Clear user cache
            await this.clearUserCache(resetData.user_id);
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('PASSWORD_RESET_COMPLETED', resetData.user_id, {
                email: resetData.email,
                tokenId: resetData.id
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const client = await this.pool.connect();
        try {
            // Get user
            const getUserQuery = 'SELECT password_hash FROM users WHERE id = $1';
            const userResult = await client.query(getUserQuery, [userId]);
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            const user = userResult.rows[0];
            // Verify old password
            const isValidOldPassword = await password_utils_1.PasswordUtils.compare(oldPassword, user.password_hash);
            if (!isValidOldPassword) {
                logger_1.SAMALogger.logSecurityEvent('PASSWORD_CHANGE_INVALID_OLD_PASSWORD', 'MEDIUM', { userId });
                throw new Error('Invalid old password');
            }
            // Validate new password
            const passwordValidation = password_utils_1.PasswordUtils.validate(newPassword);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join(', '));
            }
            // Hash new password
            const passwordHash = await password_utils_1.PasswordUtils.hash(newPassword);
            // Update password
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
            // Log for SAMA compliance
            logger_1.SAMALogger.logAuthEvent('PASSWORD_CHANGED', userId, {
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Password change failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map