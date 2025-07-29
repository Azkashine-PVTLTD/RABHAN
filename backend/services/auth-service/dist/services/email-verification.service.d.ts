export declare class EmailVerificationService {
    private sendgrid;
    private redis;
    private pool;
    constructor();
    private generateVerificationToken;
    private generateOTP;
    private getEmailAttempts;
    private incrementEmailAttempts;
    private clearEmailAttempts;
    sendVerificationEmail(email: string, userId: string, userFullName?: string): Promise<void>;
    sendOTPEmail(email: string, userId?: string): Promise<void>;
    verifyToken(token: string): Promise<{
        userId: string;
        email: string;
    }>;
    verifyOTP(email: string, otp: string, userId?: string): Promise<boolean>;
    private updateEmailVerificationStatus;
    private generateVerificationEmailHTML;
    private generateOTPEmailHTML;
}
//# sourceMappingURL=email-verification.service.d.ts.map