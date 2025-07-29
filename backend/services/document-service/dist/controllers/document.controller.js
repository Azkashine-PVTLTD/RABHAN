"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_validation_service_1 = require("../services/document-validation.service");
const document_storage_service_1 = require("../services/document-storage.service");
const virus_scanner_service_1 = require("../services/virus-scanner.service");
const database_config_1 = require("../config/database.config");
const logger_1 = require("../utils/logger");
class DocumentController {
    validationService;
    storageService;
    virusScannerService;
    database;
    constructor() {
        this.validationService = document_validation_service_1.DocumentValidationService.getInstance();
        this.storageService = document_storage_service_1.DocumentStorageService.getInstance();
        this.virusScannerService = virus_scanner_service_1.VirusScannerService.getInstance();
        this.database = database_config_1.DatabaseConfig.getInstance();
    }
    uploadDocument = async (req, res) => {
        const startTime = Date.now();
        const documentId = this.generateDocumentId();
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    code: 'MISSING_FILE',
                });
                return;
            }
            const { userId, categoryId, templateId, metadata } = req.body;
            if (!userId || !categoryId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: userId and categoryId',
                    code: 'MISSING_FIELDS',
                });
                return;
            }
            logger_1.logger.info('Document upload started', {
                documentId,
                userId,
                categoryId,
                filename: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
            });
            let existingDocs = [];
            try {
                existingDocs = await this.getExistingDocumentsForCategory(userId, categoryId);
                if (existingDocs.length > 0) {
                    logger_1.logger.info('Found existing documents in category, will replace them', {
                        documentId,
                        userId,
                        categoryId,
                        existingCount: existingDocs.length,
                        existingDocIds: existingDocs.map(doc => doc.id)
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to check existing documents, continuing with upload', {
                    documentId,
                    userId,
                    categoryId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                existingDocs = [];
            }
            const virusScanResult = await this.virusScannerService.scanFileBuffer(req.file.buffer, documentId, userId, req.file.originalname);
            if (!virusScanResult.isClean) {
                logger_1.logger.warn('Virus detected in uploaded file', {
                    documentId,
                    userId,
                    threats: virusScanResult.threats,
                    scanResult: virusScanResult.scanResult,
                });
                res.status(400).json({
                    success: false,
                    error: 'File contains threats',
                    code: 'VIRUS_DETECTED',
                    details: {
                        threats: virusScanResult.threats,
                        scanResult: virusScanResult.scanResult,
                    },
                });
                return;
            }
            const validationMetadata = {
                documentId,
                userId,
                categoryId,
                templateId,
                originalFilename: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                requiresOCR: this.shouldPerformOCR(categoryId),
                validationRules: await this.getValidationRules(categoryId),
            };
            const validationResult = await this.validationService.validateDocument(req.file.buffer, validationMetadata);
            if (!validationResult.isValid) {
                logger_1.logger.warn('Document validation failed', {
                    documentId,
                    userId,
                    score: validationResult.score,
                    confidence: validationResult.confidence,
                    errors: validationResult.errors,
                });
                res.status(400).json({
                    success: false,
                    error: 'Document validation failed',
                    code: 'VALIDATION_FAILED',
                    details: {
                        score: validationResult.score,
                        confidence: validationResult.confidence,
                        errors: validationResult.errors,
                        warnings: validationResult.warnings,
                    },
                });
                return;
            }
            const storageMetadata = {
                documentId,
                userId,
                categoryId,
                originalFilename: req.file.originalname,
                mimeType: req.file.mimetype,
                fileExtension: req.file.originalname.split('.').pop()?.toLowerCase() || '',
                encryptionRequired: true,
                createBackup: true,
            };
            const storageResult = await this.storageService.storeDocument(req.file.buffer, storageMetadata);
            const documentRecord = await this.saveDocumentMetadata({
                documentId,
                userId,
                categoryId,
                templateId,
                originalFilename: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                storagePath: storageResult.storagePath,
                encryptionKeyId: storageResult.encryptionKeyId,
                validationResult,
                virusScanResult,
                metadata: JSON.parse(metadata || '{}'),
            });
            let cleanedCount = 0;
            if (existingDocs.length > 0) {
                try {
                    await this.cleanupOldDocuments(existingDocs, userId);
                    cleanedCount = existingDocs.length;
                    logger_1.logger.info('Old documents cleaned up successfully', {
                        documentId,
                        userId,
                        categoryId,
                        cleanedCount
                    });
                }
                catch (error) {
                    logger_1.logger.error('Failed to cleanup old documents, but upload succeeded', {
                        documentId,
                        userId,
                        categoryId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Document upload completed successfully', {
                documentId,
                userId,
                categoryId,
                validationScore: validationResult.score,
                encrypted: true,
                replacedDocuments: cleanedCount,
                processingTime,
            });
            res.status(201).json({
                success: true,
                document_id: documentId,
                message: 'Document uploaded successfully',
                validation_results: {
                    overall_score: validationResult.score,
                    file_validation: { valid: true, issues: [] },
                    virus_scan: { status: 'clean', clean: true },
                    content_validation: { valid: true, confidence: validationResult.confidence, issues: [] },
                    security_validation: { valid: true, risk_level: 'low', issues: [] }
                },
                extracted_data: validationResult.extractedData,
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.logger.error('Document upload failed', {
                documentId,
                userId: req.body.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });
            logger_1.SAMALogger.logSecurityEvent('INVALID_FILE_TYPE', 'HIGH', {
                documentId,
                userId: req.body.userId,
                filename: req.file?.originalname,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });
            res.status(500).json({
                success: false,
                error: 'Document upload failed',
                code: 'UPLOAD_FAILED',
            });
        }
    };
    downloadDocument = async (req, res) => {
        const startTime = Date.now();
        const { documentId } = req.params;
        const userId = req.query.userId || req.body?.userId || '';
        try {
            logger_1.logger.info('Document download started', {
                documentId,
                userId,
            });
            const documentRecord = await this.getDocumentMetadata(documentId, userId);
            if (!documentRecord) {
                res.status(404).json({
                    success: false,
                    error: 'Document not found',
                    code: 'NOT_FOUND',
                });
                return;
            }
            if (!await this.checkDocumentAccess(documentId, userId)) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    code: 'ACCESS_DENIED',
                });
                return;
            }
            const retrievalResult = await this.storageService.retrieveDocument(documentRecord.storage_path, documentId, userId, documentRecord.encryption_key_id);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Document download completed', {
                documentId,
                userId,
                fileSize: retrievalResult.fileBuffer.length,
                processingTime,
            });
            res.setHeader('Content-Type', documentRecord.mime_type);
            res.setHeader('Content-Length', retrievalResult.fileBuffer.length);
            res.setHeader('Content-Disposition', `attachment; filename="${documentRecord.original_filename}"`);
            res.send(retrievalResult.fileBuffer);
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            logger_1.logger.error('Document download failed', {
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });
            logger_1.SAMALogger.logSecurityEvent('UNAUTHORIZED_ACCESS', 'HIGH', {
                documentId,
                userId,
                operation: 'download',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Document download failed',
                code: 'DOWNLOAD_FAILED',
            });
        }
    };
    getDocumentInfo = async (req, res) => {
        const { documentId } = req.params;
        const userId = req.query.userId || req.body?.userId || '';
        try {
            const documentRecord = await this.getDocumentMetadata(documentId, userId);
            if (!documentRecord) {
                res.status(404).json({
                    success: false,
                    error: 'Document not found',
                    code: 'NOT_FOUND',
                });
                return;
            }
            if (!await this.checkDocumentAccess(documentId, userId)) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    code: 'ACCESS_DENIED',
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    documentId: documentRecord.document_id,
                    originalFilename: documentRecord.original_filename,
                    fileSize: documentRecord.file_size,
                    mimeType: documentRecord.mime_type,
                    status: documentRecord.status,
                    uploadedAt: documentRecord.uploaded_at,
                    validationScore: documentRecord.validation_score,
                    encrypted: !!documentRecord.encryption_key_id,
                    extractedData: documentRecord.extracted_data,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get document info failed', {
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get document info',
                code: 'GET_INFO_FAILED',
            });
        }
    };
    deleteDocument = async (req, res) => {
        const { documentId } = req.params;
        const userId = req.query.userId || req.body?.userId || '';
        try {
            logger_1.logger.info('Document deletion started', {
                documentId,
                userId,
            });
            const documentRecord = await this.getDocumentMetadata(documentId, userId);
            if (!documentRecord) {
                res.status(404).json({
                    success: false,
                    error: 'Document not found',
                    code: 'NOT_FOUND',
                });
                return;
            }
            if (!await this.checkDocumentAccess(documentId, userId)) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    code: 'ACCESS_DENIED',
                });
                return;
            }
            await this.storageService.deleteDocument(documentRecord.storage_path, documentId, userId, null);
            await this.markDocumentAsDeleted(documentId, userId);
            logger_1.logger.info('Document deleted successfully', {
                documentId,
                userId,
            });
            res.json({
                success: true,
                message: 'Document deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Document deletion failed', {
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Document deletion failed',
                code: 'DELETE_FAILED',
            });
        }
    };
    listDocuments = async (req, res) => {
        const userId = req.query.userId || req.body?.userId || '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0';
        const { categoryId, status, limit = 50, offset = 0 } = req.query;
        try {
            const documents = await this.getUserDocuments(userId, categoryId, status, parseInt(limit), parseInt(offset));
            res.json({
                success: true,
                documents: documents,
                total_count: documents.length,
                filtered_count: documents.length,
                page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                limit: parseInt(limit),
            });
        }
        catch (error) {
            logger_1.logger.error('List documents failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to list documents',
                code: 'LIST_FAILED',
            });
        }
    };
    getCategories = async (req, res) => {
        try {
            const categories = await this.getDocumentCategories();
            res.json({
                success: true,
                categories: categories,
            });
        }
        catch (error) {
            logger_1.logger.error('Get categories failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get categories',
                code: 'GET_CATEGORIES_FAILED',
            });
        }
    };
    getHealthStatus = async (req, res) => {
        try {
            const [validationHealth, storageHealth, virusScanHealth,] = await Promise.all([
                this.validationService.getHealthStatus(),
                this.storageService.getHealthStatus(),
                this.virusScannerService.getHealthStatus(),
            ]);
            const isHealthy = validationHealth.status === 'healthy' &&
                storageHealth.status === 'healthy' &&
                virusScanHealth.status === 'healthy';
            res.json({
                success: true,
                status: isHealthy ? 'healthy' : 'unhealthy',
                services: {
                    validation: validationHealth,
                    storage: storageHealth,
                    virusScanner: virusScanHealth,
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                status: 'unhealthy',
                error: 'Health check failed',
            });
        }
    };
    generateDocumentId() {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    shouldPerformOCR(categoryId) {
        return false;
    }
    async getValidationRules(categoryId) {
        const query = `
      SELECT allowed_formats, max_file_size_mb
      FROM document_categories 
      WHERE id = $1
    `;
        const result = await this.database.query(query, [categoryId]);
        const row = result.rows[0];
        return row ? {
            allowed_formats: row.allowed_formats,
            max_file_size_mb: row.max_file_size_mb,
            validation_enabled: true
        } : {};
    }
    async saveDocumentMetadata(data) {
        const query = `
      INSERT INTO documents (
        user_id, category_id, original_filename,
        file_size_bytes, mime_type, file_hash, file_extension,
        storage_provider, storage_bucket, storage_path, storage_region,
        encryption_key_id, encryption_algorithm, validation_score, 
        validation_results, status, sama_audit_log
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `;
        const fileExtension = data.originalFilename.split('.').pop()?.toLowerCase() || '';
        const fileHash = require('crypto').createHash('sha256').update(data.originalFilename + Date.now()).digest('hex');
        logger_1.logger.info('Attempting to save document metadata', {
            query,
            userId: data.userId,
            categoryId: data.categoryId,
            filename: data.originalFilename
        });
        const values = [
            data.userId,
            data.categoryId,
            data.originalFilename,
            data.fileSize,
            data.mimeType,
            fileHash,
            fileExtension,
            'minio',
            'rabhan-documents',
            data.storagePath || `/uploads/${fileHash}`,
            'ksa-central',
            data.encryptionKeyId || 'default-key',
            'AES-256-GCM',
            data.validationResult?.score || 85.0,
            JSON.stringify({
                extractedData: data.validationResult?.extractedData || {},
                errors: data.validationResult?.errors || [],
                warnings: data.validationResult?.warnings || [],
                confidence: data.validationResult?.confidence || 100
            }),
            'pending',
            JSON.stringify([{ event: 'upload', timestamp: new Date().toISOString(), user_id: data.userId }])
        ];
        try {
            const result = await this.database.query(query, values);
            logger_1.logger.info('Document metadata saved successfully', {
                documentId: result.rows[0]?.id,
                userId: data.userId
            });
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to save document metadata', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: data.userId,
                categoryId: data.categoryId,
                filename: data.originalFilename,
                values: values.map((v, i) => `$${i + 1}: ${typeof v === 'string' ? v.substring(0, 100) : v}`)
            });
            throw error;
        }
    }
    async getDocumentMetadata(documentId, userId) {
        const query = `
      SELECT * FROM documents 
      WHERE id = $1 AND user_id = $2 AND status != 'archived'
    `;
        const result = await this.database.query(query, [documentId, userId]);
        return result.rows[0];
    }
    async checkDocumentAccess(documentId, userId) {
        const query = `
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE id = $1 AND user_id = $2 AND status != 'archived'
    `;
        const result = await this.database.query(query, [documentId, userId]);
        return result.rows[0].count > 0;
    }
    async markDocumentAsDeleted(documentId, userId) {
        const query = `
      UPDATE documents 
      SET status = 'archived', archived_at = $1 
      WHERE id = $2 AND user_id = $3
    `;
        await this.database.query(query, [new Date(), documentId, userId]);
    }
    async getUserDocuments(userId, categoryId, status, limit = 50, offset = 0) {
        let query = `
      SELECT 
        id as document_id, user_id, category_id, original_filename, 
        file_size_bytes, mime_type, file_hash, created_at as upload_timestamp,
        validation_score, status as document_status, approval_status,
        virus_scan_status, validation_results, sama_audit_log
      FROM documents 
      WHERE user_id = $1 AND status != 'archived'
    `;
        const params = [userId];
        let paramIndex = 2;
        if (categoryId) {
            query += ` AND category_id = $${paramIndex}`;
            params.push(categoryId);
            paramIndex++;
        }
        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        const result = await this.database.query(query, params);
        return result.rows.map(row => ({
            ...row,
            approval_status: row.approval_status || 'pending',
            virus_scan_status: row.virus_scan_status || 'pending',
            extracted_data: row.validation_results?.extractedData || {},
            sama_audit_log: row.sama_audit_log || []
        }));
    }
    async getDocumentCategories() {
        const query = `
      SELECT id, name, description, 
             allowed_formats, max_file_size_mb, required_for_role
      FROM document_categories
      WHERE is_active = true
      ORDER BY required_for_role, name
    `;
        const result = await this.database.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            allowed_formats: row.allowed_formats,
            max_file_size_mb: row.max_file_size_mb,
            required_for_kyc: row.required_for_role === 'customer' || row.required_for_role === 'contractor',
            user_type: row.required_for_role === 'customer' ? 'USER' :
                row.required_for_role === 'contractor' ? 'CONTRACTOR' : 'BOTH',
            validation_rules: {}
        }));
    }
    async getExistingDocumentsForCategory(userId, categoryId) {
        const query = `
      SELECT id, user_id, category_id, original_filename, storage_path
      FROM documents 
      WHERE user_id = $1 AND category_id = $2 AND status != 'archived'
      ORDER BY created_at DESC
    `;
        const result = await this.database.query(query, [userId, categoryId]);
        return result.rows;
    }
    async cleanupOldDocuments(oldDocuments, userId) {
        for (const doc of oldDocuments) {
            try {
                if (doc.storage_path) {
                    await this.storageService.deleteDocument(doc.storage_path, doc.id, userId, null);
                }
                await this.markDocumentAsDeleted(doc.id, userId);
                logger_1.logger.info('Old document cleaned up', {
                    documentId: doc.id,
                    userId,
                    filename: doc.original_filename
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to cleanup old document', {
                    documentId: doc.id,
                    userId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=document.controller.js.map