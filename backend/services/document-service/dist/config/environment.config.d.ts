export declare const config: {
    readonly env: string;
    readonly isProduction: boolean;
    readonly isDevelopment: boolean;
    readonly isTest: boolean;
    readonly server: {
        readonly port: number;
        readonly serviceName: string;
        readonly maxFileSize: number;
        readonly uploadTimeout: number;
        readonly allowedOrigins: string;
        readonly maxUploadsPerHour: number;
    };
    readonly database: {
        readonly url: string;
        readonly poolMin: number;
        readonly poolMax: number;
        readonly connectionTimeout: number;
        readonly idleTimeout: number;
    };
    readonly redis: {
        readonly url: string;
        readonly prefix: string;
        readonly keyExpiry: number;
    };
    readonly minio: {
        readonly endpoint: string;
        readonly port: number;
        readonly useSSL: boolean;
        readonly accessKey: string;
        readonly secretKey: string;
        readonly bucketName: string;
        readonly region: string;
    };
    readonly aws: {
        readonly accessKeyId: string;
        readonly secretAccessKey: string;
        readonly region: string;
        readonly s3Bucket: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly encryption: {
        readonly algorithm: string;
        readonly keyLength: number;
        readonly ivLength: number;
        readonly tagLength: number;
        readonly masterKey: string;
    };
    readonly virusScanner: {
        readonly enabled: boolean;
        readonly clamAvPath: string;
        readonly scanTimeout: number;
        readonly maxRetries: number;
    };
    readonly ocr: {
        readonly enabled: boolean;
        readonly tesseractPath: string;
        readonly languages: string;
        readonly minConfidence: number;
    };
    readonly validation: {
        readonly maxFileSize: number;
        readonly allowedFormats: string[];
        readonly minImageWidth: number;
        readonly minImageHeight: number;
        readonly maxImageWidth: number;
        readonly maxImageHeight: number;
    };
    readonly security: {
        readonly rateLimitWindowMs: number;
        readonly rateLimitMaxRequests: number;
        readonly sessionTimeoutMs: number;
        readonly maxConcurrentUploads: number;
    };
    readonly sama: {
        readonly auditEnabled: boolean;
        readonly complianceMode: string;
        readonly notificationEndpoint: string;
        readonly reportingEndpoint: string;
        readonly incidentNotificationTimeoutMs: number;
        readonly dataRetentionYears: number;
    };
    readonly authService: {
        readonly baseUrl: string;
        readonly healthCheckPath: string;
        readonly verifyTokenPath: string;
        readonly timeout: number;
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
        readonly maxFiles: number;
        readonly maxSize: string;
        readonly enableConsole: boolean;
    };
    readonly monitoring: {
        readonly enabled: boolean;
        readonly endpoint: string;
        readonly interval: number;
    };
    readonly backup: {
        readonly enabled: boolean;
        readonly schedule: string;
        readonly retentionDays: number;
        readonly destination: string;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=environment.config.d.ts.map