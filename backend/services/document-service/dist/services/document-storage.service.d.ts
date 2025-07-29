export interface StorageResult {
    success: boolean;
    storagePath: string;
    etag: string;
    size: number;
    encryptionKeyId: string;
    backupPath?: string | undefined;
    uploadTime: number;
}
export interface StorageMetadata {
    documentId: string;
    userId: string;
    categoryId: string;
    originalFilename: string;
    mimeType: string;
    fileExtension: string;
    encryptionRequired: boolean;
    createBackup: boolean;
    compressionLevel?: number;
}
export declare class DocumentStorageService {
    private static instance;
    private minio;
    private encryption;
    private constructor();
    static getInstance(): DocumentStorageService;
    storeDocument(fileBuffer: Buffer, metadata: StorageMetadata): Promise<StorageResult>;
    retrieveDocument(storagePath: string, documentId: string, userId: string, encryptionKeyId?: string): Promise<{
        fileBuffer: Buffer;
        metadata: any;
        retrievalTime: number;
    }>;
    deleteDocument(storagePath: string, documentId: string, userId: string, backupPath?: string): Promise<{
        success: boolean;
        deletionTime: number;
    }>;
    private createBackup;
    private generateStoragePath;
    private generateBackupPath;
    generateThumbnail(fileBuffer: Buffer, documentId: string, size?: 'small' | 'medium' | 'large'): Promise<{
        thumbnailBuffer: Buffer;
        thumbnailPath: string;
    }>;
    getStorageStatistics(): Promise<{
        totalDocuments: number;
        totalSize: number;
        totalBackups: number;
        totalThumbnails: number;
        storageHealth: string;
    }>;
    cleanupOldFiles(retentionDays?: number): Promise<{
        deletedFiles: number;
        freedSpace: number;
    }>;
    verifyFileIntegrity(storagePath: string, expectedHash: string, documentId: string): Promise<{
        isValid: boolean;
        actualHash: string;
        verificationTime: number;
    }>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            minioConnected: boolean;
            bucketExists: boolean;
            encryptionServiceHealthy: boolean;
            totalDocuments: number;
            totalSize: number;
            availableSpace: number;
        };
    }>;
    private storeToLocalFilesystem;
}
//# sourceMappingURL=document-storage.service.d.ts.map