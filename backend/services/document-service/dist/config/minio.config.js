"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioConfig = void 0;
const minio_1 = require("minio");
const environment_config_1 = require("./environment.config");
const logger_1 = require("../utils/logger");
class MinioConfig {
    static instance;
    client;
    isConnected = false;
    constructor() {
        this.client = new minio_1.Client({
            endPoint: environment_config_1.config.minio.endpoint,
            port: environment_config_1.config.minio.port,
            useSSL: environment_config_1.config.minio.useSSL,
            accessKey: environment_config_1.config.minio.accessKey,
            secretKey: environment_config_1.config.minio.secretKey,
            region: environment_config_1.config.minio.region,
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!MinioConfig.instance) {
            MinioConfig.instance = new MinioConfig();
        }
        return MinioConfig.instance;
    }
    setupEventHandlers() {
    }
    getClient() {
        return this.client;
    }
    async connect() {
        try {
            await this.client.listBuckets();
            await this.ensureBucketExists(environment_config_1.config.minio.bucketName);
            this.isConnected = true;
            logger_1.logger.info('MinIO connected successfully', {
                endpoint: environment_config_1.config.minio.endpoint,
                bucket: environment_config_1.config.minio.bucketName,
                region: environment_config_1.config.minio.region,
            });
        }
        catch (error) {
            logger_1.logger.error('MinIO connection failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                endpoint: environment_config_1.config.minio.endpoint,
            });
            throw error;
        }
    }
    async disconnect() {
        this.isConnected = false;
        logger_1.logger.info('MinIO disconnected');
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            const buckets = await this.client.listBuckets();
            const bucketExists = buckets.some(bucket => bucket.name === environment_config_1.config.minio.bucketName);
            let bucketPolicy = null;
            if (bucketExists) {
                try {
                    bucketPolicy = await this.client.getBucketPolicy(environment_config_1.config.minio.bucketName);
                }
                catch (error) {
                }
            }
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    responseTime,
                    bucketExists,
                    bucketPolicy,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('MinIO health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                details: {
                    connected: false,
                    responseTime: Date.now() - startTime,
                    bucketExists: false,
                },
            };
        }
    }
    async ensureBucketExists(bucketName) {
        try {
            const bucketExists = await this.client.bucketExists(bucketName);
            if (!bucketExists) {
                await this.client.makeBucket(bucketName, environment_config_1.config.minio.region);
                logger_1.logger.info(`MinIO bucket created: ${bucketName}`);
                await this.setBucketPolicy(bucketName);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to ensure bucket exists: ${bucketName}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async setBucketPolicy(bucketName) {
        try {
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Deny',
                        Principal: '*',
                        Action: 's3:*',
                        Resource: [
                            `arn:aws:s3:::${bucketName}`,
                            `arn:aws:s3:::${bucketName}/*`,
                        ],
                    },
                ],
            };
            await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
            logger_1.logger.info(`MinIO bucket policy set: ${bucketName}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to set bucket policy: ${bucketName}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async uploadFile(bucketName, objectName, fileBuffer, metadata = {}) {
        const startTime = Date.now();
        try {
            await this.client.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
                'Content-Type': metadata.contentType || 'application/octet-stream',
                'X-Document-ID': metadata.documentId,
                'X-User-ID': metadata.userId,
                'X-Upload-Date': new Date().toISOString(),
                'X-Encryption-Status': 'encrypted',
                ...metadata,
            });
            const uploadTime = Date.now() - startTime;
            const objectInfo = await this.client.statObject(bucketName, objectName);
            const etag = objectInfo.etag;
            logger_1.logger.info('File uploaded to MinIO', {
                bucketName,
                objectName,
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
            logger_1.logger.error('MinIO file upload failed:', {
                bucketName,
                objectName,
                size: fileBuffer.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async downloadFile(bucketName, objectName) {
        try {
            const chunks = [];
            const stream = await this.client.getObject(bucketName, objectName);
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                stream.on('end', () => {
                    const fileBuffer = Buffer.concat(chunks);
                    logger_1.logger.debug('File downloaded from MinIO', {
                        bucketName,
                        objectName,
                        size: fileBuffer.length,
                    });
                    resolve(fileBuffer);
                });
                stream.on('error', (error) => {
                    logger_1.logger.error('MinIO file download failed:', {
                        bucketName,
                        objectName,
                        error: error.message,
                    });
                    reject(error);
                });
            });
        }
        catch (error) {
            logger_1.logger.error('MinIO file download failed:', {
                bucketName,
                objectName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async deleteFile(bucketName, objectName) {
        try {
            await this.client.removeObject(bucketName, objectName);
            logger_1.logger.info('File deleted from MinIO', {
                bucketName,
                objectName,
            });
        }
        catch (error) {
            logger_1.logger.error('MinIO file deletion failed:', {
                bucketName,
                objectName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async fileExists(bucketName, objectName) {
        try {
            await this.client.statObject(bucketName, objectName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getFileInfo(bucketName, objectName) {
        try {
            const stats = await this.client.statObject(bucketName, objectName);
            return {
                size: stats.size,
                lastModified: stats.lastModified,
                etag: stats.etag,
                contentType: stats.metaData?.['content-type'] || 'application/octet-stream',
                metadata: stats.metaData || {},
            };
        }
        catch (error) {
            logger_1.logger.error('MinIO file info retrieval failed:', {
                bucketName,
                objectName,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async listFiles(bucketName, prefix = '', maxKeys = 1000) {
        try {
            const files = [];
            const stream = this.client.listObjects(bucketName, prefix, true);
            return new Promise((resolve, reject) => {
                let count = 0;
                stream.on('data', (obj) => {
                    if (count >= maxKeys) {
                        stream.destroy();
                        resolve({
                            files,
                            isTruncated: true,
                        });
                        return;
                    }
                    files.push({
                        name: obj.name,
                        size: obj.size,
                        lastModified: obj.lastModified,
                        etag: obj.etag,
                    });
                    count++;
                });
                stream.on('end', () => {
                    resolve({
                        files,
                        isTruncated: false,
                    });
                });
                stream.on('error', (error) => {
                    logger_1.logger.error('MinIO list files failed:', {
                        bucketName,
                        prefix,
                        error: error.message,
                    });
                    reject(error);
                });
            });
        }
        catch (error) {
            logger_1.logger.error('MinIO list files failed:', {
                bucketName,
                prefix,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async createBackup(bucketName, objectName, backupBucket) {
        try {
            const backupObjectName = `backups/${new Date().toISOString().split('T')[0]}/${objectName}`;
            await this.client.copyObject(backupBucket, backupObjectName, `${bucketName}/${objectName}`, null);
            logger_1.logger.info('Backup created in MinIO', {
                sourceObject: `${bucketName}/${objectName}`,
                backupObject: `${backupBucket}/${backupObjectName}`,
            });
        }
        catch (error) {
            logger_1.logger.error('MinIO backup creation failed:', {
                bucketName,
                objectName,
                backupBucket,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    generateStoragePath(documentId, userId, category, fileExtension) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `documents/${year}/${month}/${day}/${category}/${userId}/${documentId}.${fileExtension}.encrypted`;
    }
    generateThumbnailPath(documentId, size = 'medium') {
        return `thumbnails/${documentId}/${size}.jpg`;
    }
    generateTempPath(sessionId, filename) {
        return `temp/uploads/${sessionId}/${filename}`;
    }
    isHealthy() {
        return this.isConnected;
    }
}
exports.MinioConfig = MinioConfig;
//# sourceMappingURL=minio.config.js.map