import { Client as MinioClient } from 'minio';
export declare class MinioConfig {
    private static instance;
    private client;
    private isConnected;
    private constructor();
    static getInstance(): MinioConfig;
    private setupEventHandlers;
    getClient(): MinioClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            connected: boolean;
            responseTime: number;
            bucketExists: boolean;
            bucketPolicy?: any;
        };
    }>;
    ensureBucketExists(bucketName: string): Promise<void>;
    setBucketPolicy(bucketName: string): Promise<void>;
    uploadFile(bucketName: string, objectName: string, fileBuffer: Buffer, metadata?: any): Promise<{
        etag: string;
        size: number;
        uploadTime: number;
    }>;
    downloadFile(bucketName: string, objectName: string): Promise<Buffer>;
    deleteFile(bucketName: string, objectName: string): Promise<void>;
    fileExists(bucketName: string, objectName: string): Promise<boolean>;
    getFileInfo(bucketName: string, objectName: string): Promise<{
        size: number;
        lastModified: Date;
        etag: string;
        contentType: string;
        metadata: any;
    }>;
    listFiles(bucketName: string, prefix?: string, maxKeys?: number): Promise<{
        files: Array<{
            name: string;
            size: number;
            lastModified: Date;
            etag: string;
        }>;
        isTruncated: boolean;
    }>;
    createBackup(bucketName: string, objectName: string, backupBucket: string): Promise<void>;
    generateStoragePath(documentId: string, userId: string, category: string, fileExtension: string): string;
    generateThumbnailPath(documentId: string, size?: 'small' | 'medium' | 'large'): string;
    generateTempPath(sessionId: string, filename: string): string;
    isHealthy(): boolean;
}
//# sourceMappingURL=minio.config.d.ts.map