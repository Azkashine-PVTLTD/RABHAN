export declare class SendGridConfig {
    private static instance;
    private isConfigured;
    private constructor();
    static getInstance(): SendGridConfig;
    sendEmail(to: string, subject: string, html: string): Promise<void>;
    sendTemplateEmail(to: string, templateId: string, dynamicData: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=sendgrid.config.d.ts.map