export declare enum VerificationType {
    EMAIL = "EMAIL",
    PHONE = "PHONE",
    PASSWORD_RESET = "PASSWORD_RESET"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    EXPIRED = "EXPIRED",
    FAILED = "FAILED"
}
export interface VerificationToken {
    id: string;
    userId: string;
    verificationType: VerificationType;
    token: string;
    code?: string;
    targetValue: string;
    status: VerificationStatus;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface SendVerificationRequest {
    userId: string;
    type: VerificationType;
    targetValue: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface VerifyCodeRequest {
    userId: string;
    token?: string;
    code?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    resetTime?: Date;
}
export declare class VerificationService {
    private pool;
    private redis;
    private emailService;
    private phoneVerificationService;
    constructor();
    /**
     * Send verification code/link
     */
    sendVerification(request: SendVerificationRequest): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Verify code or token
     */
    verifyCode(request: VerifyCodeRequest): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Resend verification
     */
    resendVerification(userId: string, type: VerificationType, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Check verification status
     */
    getVerificationStatus(userId: string): Promise<{
        emailVerified: boolean;
        phoneVerified: boolean;
    }>;
    private checkRateLimit;
    private cleanupPendingVerifications;
    private logVerificationAttempt;
    private generateSecureToken;
    private generateOTPCode;
    private getSuccessMessage;
    private getVerificationSuccessMessage;
    private cacheUserVerificationStatus;
    private getUserVerificationCache;
    private clearUserVerificationCache;
}
//# sourceMappingURL=verification.service.d.ts.map