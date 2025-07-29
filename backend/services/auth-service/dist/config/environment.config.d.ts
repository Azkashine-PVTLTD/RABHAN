export declare const config: {
    readonly env: string;
    readonly isProduction: boolean;
    readonly isDevelopment: boolean;
    readonly isTest: boolean;
    readonly server: {
        readonly port: number;
        readonly serviceName: string;
    };
    readonly database: {
        readonly url: string;
        readonly poolMin: number;
        readonly poolMax: number;
    };
    readonly redis: {
        readonly url: string;
        readonly prefix: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly refreshSecret: string;
        readonly accessTokenExpiresIn: string;
        readonly refreshTokenExpiresIn: string;
    };
    readonly twilio: {
        readonly accountSid: string | undefined;
        readonly authToken: string | undefined;
        readonly phoneNumber: string | undefined;
        readonly useDummyOTP: boolean;
    };
    readonly sendgrid: {
        readonly apiKey: string | undefined;
        readonly fromEmail: string;
        readonly fromName: string;
        readonly emailVerificationTemplateId: string | undefined;
    };
    readonly email: {
        readonly service: string;
        readonly from: string;
    };
    readonly frontend: {
        readonly url: string;
        readonly domain: string;
    };
    readonly security: {
        readonly bcryptRounds: number;
        readonly rateLimitWindowMs: number;
        readonly rateLimitMaxRequests: number;
        readonly sessionTimeoutMs: number;
        readonly maxLoginAttempts: number;
        readonly accountLockDurationMs: number;
    };
    readonly sama: {
        readonly auditEnabled: boolean;
        readonly complianceMode: string;
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=environment.config.d.ts.map