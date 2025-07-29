"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStorageService = void 0;
const minio_config_1 = require("../config/minio.config");
const encryption_service_1 = require("./encryption.service");
const logger_1 = require("../utils/logger");
const environment_config_1 = require("../config/environment.config");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class DocumentStorageService {
    static instance;
    minio;
    encryption;
    constructor() {
        this.minio = minio_config_1.MinioConfig.getInstance();
        this.encryption = encryption_service_1.EncryptionService.getInstance();
    }
    static getInstance() {
        if (!DocumentStorageService.instance) {
            DocumentStorageService.instance = new DocumentStorageService();
        }
        return DocumentStorageService.instance;
    }
    async storeDocument(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting document storage', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                filename: metadata.originalFilename,
                size: fileBuffer.length,
                encryptionRequired: metadata.encryptionRequired,
            });
            if (fileBuffer.length === 0) {
                throw new Error('Empty file buffer');
            }
            if (fileBuffer.length > environment_config_1.config.server.maxFileSize) {
                throw new Error(`File size ${fileBuffer.length} exceeds maximum ${environment_config_1.config.server.maxFileSize}`);
            }
            let processedBuffer = fileBuffer;
            let encryptionKeyId = '';
            if (metadata.encryptionRequired) {
                const encryptionResult = await this.encryption.encryptBuffer(fileBuffer, metadata.documentId, metadata.userId);
                processedBuffer = encryptionResult.encryptedBuffer;
                encryptionKeyId = encryptionResult.keyId;
                logger_1.logger.debug('File encrypted', {
                    documentId: metadata.documentId,
                    originalSize: fileBuffer.length,
                    encryptedSize: processedBuffer.length,
                    keyId: encryptionKeyId,
                });
            }
            const storagePath = this.generateStoragePath(metadata);
            const uploadMetadata = {
                documentId: metadata.documentId,
                userId: metadata.userId,
                categoryId: metadata.categoryId,
                originalFilename: metadata.originalFilename,
                contentType: metadata.mimeType,
                fileExtension: metadata.fileExtension,
                encryptionKeyId,
                encrypted: metadata.encryptionRequired,
                uploadTimestamp: new Date().toISOString(),
                fileHash: this.encryption.generateFileHash(fileBuffer),
                originalSize: fileBuffer.length,
                processedSize: processedBuffer.length,
            };
            let uploadResult;
            if (environment_config_1.config.isDevelopment) {
                uploadResult = await this.storeToLocalFilesystem(storagePath, processedBuffer, uploadMetadata);
            }
            else {
                uploadResult = await this.minio.uploadFile(environment_config_1.config.minio.bucketName, storagePath, processedBuffer, uploadMetadata);
            }
            let backupPath;
            if (metadata.createBackup) {
                backupPath = await this.createBackup(storagePath, processedBuffer, metadata);
            }
            const uploadTime = Date.now() - startTime;
            logger_1.SAMALogger.logDocumentEvent('DOCUMENT_UPLOAD', metadata.documentId, metadata.userId, {
                storagePath,
                encrypted: metadata.encryptionRequired,
                backupCreated: !!backupPath,
                uploadTime,
                fileSize: fileBuffer.length,
                processedSize: processedBuffer.length,
            });
            const result = {
                success: true,
                storagePath,
                etag: uploadResult.etag,
                size: uploadResult.size,
                encryptionKeyId,
                backupPath,
                uploadTime,
            };
            logger_1.logger.info('Document stored successfully', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                storagePath,
                size: result.size,
                encrypted: metadata.encryptionRequired,
                uploadTime,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Document storage failed:', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            logger_1.SAMALogger.logSecurityEvent('ENCRYPTION_FAILURE', 'HIGH', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                operation: 'store',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async retrieveDocument(storagePath, documentId, userId, encryptionKeyId) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting document retrieval', {
                documentId,
                userId,
                storagePath,
                encrypted: !!encryptionKeyId,
            });
            let encryptedBuffer;
            if (environment_config_1.config.isDevelopment) {
                const localStorageDir = path_1.default.join(process.cwd(), 'uploads');
                const fullPath = path_1.default.join(localStorageDir, storagePath);
                encryptedBuffer = await promises_1.default.readFile(fullPath);
            }
            else {
                encryptedBuffer = await this.minio.downloadFile(environment_config_1.config.minio.bucketName, storagePath);
            }
            let fileInfo;
            if (environment_config_1.config.isDevelopment) {
                fileInfo = {
                    size: encryptedBuffer.length,
                    lastModified: new Date(),
                    etag: require('crypto').createHash('md5').update(encryptedBuffer).digest('hex'),
                    contentType: 'application/octet-stream',
                    metadata: {},
                };
            }
            else {
                fileInfo = await this.minio.getFileInfo(environment_config_1.config.minio.bucketName, storagePath);
            }
            let fileBuffer = encryptedBuffer;
            if (encryptionKeyId) {
                fileBuffer = await this.encryption.decryptBuffer(encryptedBuffer, encryptionKeyId, documentId, userId);
                logger_1.logger.debug('File decrypted', {
                    documentId,
                    encryptedSize: encryptedBuffer.length,
                    decryptedSize: fileBuffer.length,
                    keyId: encryptionKeyId,
                });
            }
            const retrievalTime = Date.now() - startTime;
            logger_1.SAMALogger.logDocumentEvent('DOCUMENT_DOWNLOAD', documentId, userId, {
                storagePath,
                encrypted: !!encryptionKeyId,
                retrievalTime,
                fileSize: fileBuffer.length,
            });
            logger_1.logger.info('Document retrieved successfully', {
                documentId,
                userId,
                storagePath,
                size: fileBuffer.length,
                retrievalTime,
            });
            return {
                fileBuffer,
                metadata: fileInfo.metadata,
                retrievalTime,
            };
        }
        catch (error) {
            logger_1.logger.error('Document retrieval failed:', {
                documentId,
                userId,
                storagePath,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            logger_1.SAMALogger.logSecurityEvent('UNAUTHORIZED_ACCESS', 'HIGH', {
                documentId,
                userId,
                storagePath,
                operation: 'retrieve',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async deleteDocument(storagePath, documentId, userId, backupPath) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting document deletion', {
                documentId,
                userId,
                storagePath,
                hasBackup: !!backupPath,
            });
            if (environment_config_1.config.isDevelopment) {
                const localStorageDir = path_1.default.join(process.cwd(), 'uploads');
                const fullPath = path_1.default.join(localStorageDir, storagePath);
                try {
                    await promises_1.default.unlink(fullPath);
                }
                catch (error) {
                    logger_1.logger.warn('Failed to delete local file (might not exist)', { fullPath });
                }
            }
            else {
                await this.minio.deleteFile(environment_config_1.config.minio.bucketName, storagePath);
            }
            if (backupPath) {
                if (environment_config_1.config.isDevelopment) {
                    const localStorageDir = path_1.default.join(process.cwd(), 'uploads');
                    const fullBackupPath = path_1.default.join(localStorageDir, backupPath);
                    try {
                        await promises_1.default.unlink(fullBackupPath);
                    }
                    catch (error) {
                        logger_1.logger.warn('Failed to delete local backup file (might not exist)', { fullBackupPath });
                    }
                }
                else {
                    await this.minio.deleteFile(environment_config_1.config.minio.bucketName, backupPath);
                }
            }
            const deletionTime = Date.now() - startTime;
            logger_1.SAMALogger.logDocumentEvent('DOCUMENT_DELETE', documentId, userId, {
                storagePath,
                backupPath,
                deletionTime,
            });
            logger_1.logger.info('Document deleted successfully', {
                documentId,
                userId,
                storagePath,
                deletionTime,
            });
            return {
                success: true,
                deletionTime,
            };
        }
        catch (error) {
            logger_1.logger.error('Document deletion failed:', {
                documentId,
                userId,
                storagePath,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async createBackup(originalPath, fileBuffer, metadata) {
        try {
            const backupPath = this.generateBackupPath(originalPath);
            const backupMetadata = {
                ...metadata,
                backupOf: originalPath,
                backupTimestamp: new Date().toISOString(),
                backupType: 'automatic',
            };
            if (environment_config_1.config.isDevelopment) {
                await this.storeToLocalFilesystem(backupPath, fileBuffer, backupMetadata);
            }
            else {
                await this.minio.uploadFile(environment_config_1.config.minio.bucketName, backupPath, fileBuffer, backupMetadata);
            }
            logger_1.logger.debug('Backup created', {
                documentId: metadata.documentId,
                originalPath,
                backupPath,
            });
            return backupPath;
        }
        catch (error) {
            logger_1.logger.error('Backup creation failed:', {
                documentId: metadata.documentId,
                originalPath,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    generateStoragePath(metadata) {
        return this.minio.generateStoragePath(metadata.documentId, metadata.userId, metadata.categoryId, metadata.fileExtension);
    }
    generateBackupPath(originalPath) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timestamp = date.getTime();
        return `backups/${dateStr}/${timestamp}_${originalPath}`;
    }
    async generateThumbnail(fileBuffer, documentId, size = 'medium') {
        try {
            const sharp = require('sharp');
            const sizeMap = {
                small: { width: 150, height: 150 },
                medium: { width: 300, height: 300 },
                large: { width: 600, height: 600 },
            };
            const dimensions = sizeMap[size];
            const thumbnailBuffer = await sharp(fileBuffer)
                .resize(dimensions.width, dimensions.height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .jpeg({ quality: 80 })
                .toBuffer();
            const thumbnailPath = this.minio.generateThumbnailPath(documentId, size);
            await this.minio.uploadFile(environment_config_1.config.minio.bucketName, thumbnailPath, thumbnailBuffer, {
                documentId,
                thumbnailSize: size,
                contentType: 'image/jpeg',
                originalSize: fileBuffer.length,
                thumbnailSize: thumbnailBuffer.length,
            });
            logger_1.logger.debug('Thumbnail generated', {
                documentId,
                size,
                originalSize: fileBuffer.length,
                thumbnailSize: thumbnailBuffer.length,
                thumbnailPath,
            });
            return {
                thumbnailBuffer,
                thumbnailPath,
            };
        }
        catch (error) {
            logger_1.logger.error('Thumbnail generation failed:', {
                documentId,
                size,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getStorageStatistics() {
        try {
            const documentsList = await this.minio.listFiles(environment_config_1.config.minio.bucketName, 'documents/', 10000);
            const backupsList = await this.minio.listFiles(environment_config_1.config.minio.bucketName, 'backups/', 10000);
            const thumbnailsList = await this.minio.listFiles(environment_config_1.config.minio.bucketName, 'thumbnails/', 10000);
            const totalSize = documentsList.files.reduce((sum, file) => sum + file.size, 0);
            return {
                totalDocuments: documentsList.files.length,
                totalSize,
                totalBackups: backupsList.files.length,
                totalThumbnails: thumbnailsList.files.length,
                storageHealth: 'healthy',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get storage statistics:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                totalDocuments: 0,
                totalSize: 0,
                totalBackups: 0,
                totalThumbnails: 0,
                storageHealth: 'unhealthy',
            };
        }
    }
    async cleanupOldFiles(retentionDays = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const backupsList = await this.minio.listFiles(environment_config_1.config.minio.bucketName, 'backups/', 10000);
            const tempsList = await this.minio.listFiles(environment_config_1.config.minio.bucketName, 'temp/', 10000);
            const filesToDelete = [
                ...backupsList.files.filter(file => file.lastModified < cutoffDate),
                ...tempsList.files.filter(file => file.lastModified < cutoffDate),
            ];
            let deletedFiles = 0;
            let freedSpace = 0;
            for (const file of filesToDelete) {
                try {
                    await this.minio.deleteFile(environment_config_1.config.minio.bucketName, file.name);
                    deletedFiles++;
                    freedSpace += file.size;
                }
                catch (error) {
                    logger_1.logger.warn('Failed to delete old file:', {
                        filename: file.name,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
            logger_1.logger.info('Old files cleanup completed', {
                deletedFiles,
                freedSpace,
                retentionDays,
            });
            return {
                deletedFiles,
                freedSpace,
            };
        }
        catch (error) {
            logger_1.logger.error('Old files cleanup failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                deletedFiles: 0,
                freedSpace: 0,
            };
        }
    }
    async verifyFileIntegrity(storagePath, expectedHash, documentId) {
        const startTime = Date.now();
        try {
            const fileBuffer = await this.minio.downloadFile(environment_config_1.config.minio.bucketName, storagePath);
            const actualHash = this.encryption.generateFileHash(fileBuffer);
            const isValid = actualHash === expectedHash;
            const verificationTime = Date.now() - startTime;
            if (!isValid) {
                logger_1.logger.error('File integrity verification failed', {
                    documentId,
                    storagePath,
                    expectedHash,
                    actualHash,
                });
                logger_1.SAMALogger.logSecurityEvent('ENCRYPTION_FAILURE', 'CRITICAL', {
                    documentId,
                    storagePath,
                    expectedHash,
                    actualHash,
                    integrityCheck: 'failed',
                });
            }
            return {
                isValid,
                actualHash,
                verificationTime,
            };
        }
        catch (error) {
            logger_1.logger.error('File integrity verification error:', {
                documentId,
                storagePath,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getHealthStatus() {
        try {
            const minioHealth = await this.minio.healthCheck();
            const encryptionHealth = this.encryption.getHealthStatus();
            const stats = await this.getStorageStatistics();
            const isHealthy = minioHealth.status === 'healthy' &&
                encryptionHealth.status === 'healthy' &&
                stats.storageHealth === 'healthy';
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                details: {
                    minioConnected: minioHealth.details.connected,
                    bucketExists: minioHealth.details.bucketExists,
                    encryptionServiceHealthy: encryptionHealth.status === 'healthy',
                    totalDocuments: stats.totalDocuments,
                    totalSize: stats.totalSize,
                    availableSpace: environment_config_1.config.server.maxFileSize * 10000,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Storage health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                details: {
                    minioConnected: false,
                    bucketExists: false,
                    encryptionServiceHealthy: false,
                    totalDocuments: 0,
                    totalSize: 0,
                    availableSpace: 0,
                },
            };
        }
    }
    async storeToLocalFilesystem(storagePath, fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const localStorageDir = path_1.default.join(process.cwd(), 'uploads');
            const fullPath = path_1.default.join(localStorageDir, storagePath);
            const dirPath = path_1.default.dirname(fullPath);
            await promises_1.default.mkdir(dirPath, { recursive: true });
            await promises_1.default.writeFile(fullPath, fileBuffer);
            const crypto = require('crypto');
            const etag = crypto.createHash('md5').update(fileBuffer).digest('hex');
            const uploadTime = Date.now() - startTime;
            logger_1.logger.info('File stored to local filesystem', {
                storagePath,
                fullPath,
                size: fileBuffer.length,
                uploadTime,
                etag,
            });
            return {
                etag,
                size: fileBuffer.length,
                uploadTime,
            };
        }
        catch (error) {
            logger_1.logger.error('Local filesystem storage failed:', {
                storagePath,
                size: fileBuffer.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.DocumentStorageService = DocumentStorageService;
//# sourceMappingURL=document-storage.service.js.map