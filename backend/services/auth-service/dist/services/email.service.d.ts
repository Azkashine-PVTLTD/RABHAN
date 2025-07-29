export interface EmailResult {
    success: boolean;
    message: string;
}
export declare class EmailService {
    private transporter;
    constructor();
    private initializeTransporter;
    /**
     * Send verification email
     */
    sendVerificationEmail(email: string, token: string, userId: string): Promise<EmailResult>;
    /**
     * Send welcome email after successful verification
     */
    sendWelcomeEmail(email: string, userName: string, userRole: string): Promise<EmailResult>;
    /**
     * Generate verification email HTML
     */
    private generateVerificationEmailHTML;
    /**
     * Generate welcome email HTML
     */
    private generateWelcomeEmailHTML;
    /**
     * Simulate email sending (replace with real email service in production)
     */
    private simulateEmailSend;
}
//# sourceMappingURL=email.service.d.ts.map