"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentValidationService = void 0;
const file_type_1 = require("file-type");
const sharp_1 = __importDefault(require("sharp"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const tesseract_js_1 = require("tesseract.js");
const logger_1 = require("../utils/logger");
const environment_config_1 = require("../config/environment.config");
class DocumentValidationService {
    static instance;
    tesseractWorker;
    constructor() {
        this.initializeTesseract();
    }
    static getInstance() {
        if (!DocumentValidationService.instance) {
            DocumentValidationService.instance = new DocumentValidationService();
        }
        return DocumentValidationService.instance;
    }
    async initializeTesseract() {
        if (environment_config_1.config.ocr.enabled) {
            try {
                this.tesseractWorker = await (0, tesseract_js_1.createWorker)(environment_config_1.config.ocr.languages);
                logger_1.logger.info('Tesseract OCR initialized', {
                    languages: environment_config_1.config.ocr.languages,
                    minConfidence: environment_config_1.config.ocr.minConfidence,
                });
            }
            catch (error) {
                logger_1.logger.error('Tesseract initialization failed:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    async validateDocument(fileBuffer, metadata) {
        const startTime = Date.now();
        const validationResult = {
            isValid: false,
            score: 0,
            confidence: 0,
            errors: [],
            warnings: [],
            extractedData: {},
            processingTime: 0,
            checks: [],
        };
        try {
            logger_1.logger.info('Starting simplified document validation', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                filename: metadata.originalFilename,
                fileSize: metadata.fileSize,
            });
            const formatCheck = await this.validateFileFormat(fileBuffer, metadata);
            validationResult.checks.push(formatCheck);
            const sizeCheck = await this.validateFileSize(fileBuffer, metadata);
            validationResult.checks.push(sizeCheck);
            const securityCheck = await this.validateBasicSecurity(fileBuffer, metadata);
            validationResult.checks.push(securityCheck);
            const passedChecks = validationResult.checks.filter(check => check.passed).length;
            const totalChecks = validationResult.checks.length;
            validationResult.score = Math.round((passedChecks / totalChecks) * 100);
            validationResult.confidence = Math.round((passedChecks / totalChecks) * 100);
            validationResult.isValid = validationResult.score >= 75;
            for (const check of validationResult.checks) {
                if (!check.passed) {
                    validationResult.errors.push(`${check.type}: ${check.details.error || 'Validation failed'}`);
                }
                if (check.details.warnings) {
                    validationResult.warnings.push(...check.details.warnings);
                }
            }
            validationResult.processingTime = Date.now() - startTime;
            logger_1.logger.info('Simplified document validation completed', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                isValid: validationResult.isValid,
                score: validationResult.score,
                confidence: validationResult.confidence,
                processingTime: validationResult.processingTime,
                errors: validationResult.errors.length,
                warnings: validationResult.warnings.length,
            });
            return validationResult;
        }
        catch (error) {
            logger_1.logger.error('Document validation failed:', {
                documentId: metadata.documentId,
                userId: metadata.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            validationResult.errors.push('Validation process failed');
            validationResult.processingTime = Date.now() - startTime;
            validationResult.isValid = false;
            validationResult.score = 0;
            return validationResult;
        }
    }
    async validateFileFormat(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const detectedType = await (0, file_type_1.fileTypeFromBuffer)(fileBuffer);
            if (!detectedType) {
                return {
                    type: 'format',
                    passed: false,
                    score: 0,
                    details: {
                        error: 'Could not detect file type',
                        detectedType: null,
                        expectedTypes: environment_config_1.config.validation.allowedFormats,
                    },
                    processingTime: Date.now() - startTime,
                };
            }
            const allowedMimeTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
            ];
            const isAllowedType = allowedMimeTypes.includes(detectedType.mime);
            const matchesDeclaredType = detectedType.mime === metadata.mimeType;
            const fileExtension = metadata.originalFilename.split('.').pop()?.toLowerCase();
            const expectedExtension = detectedType.ext;
            return {
                type: 'format',
                passed: isAllowedType && matchesDeclaredType,
                score: isAllowedType && matchesDeclaredType ? 100 : 0,
                details: {
                    detectedType: detectedType.mime,
                    detectedExtension: detectedType.ext,
                    declaredType: metadata.mimeType,
                    fileExtension,
                    expectedExtension,
                    isAllowedType,
                    matchesDeclaredType,
                    allowedTypes: allowedMimeTypes,
                },
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'format',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    async validateFileSize(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const actualSize = fileBuffer.length;
            const maxSize = environment_config_1.config.validation.maxFileSize;
            const minSize = 1024;
            const isValidSize = actualSize >= minSize && actualSize <= maxSize;
            const sizeDifference = Math.abs(actualSize - metadata.fileSize);
            const maxSizeDifference = Math.max(1024, metadata.fileSize * 0.01);
            const matchesDeclaredSize = sizeDifference <= maxSizeDifference;
            return {
                type: 'size',
                passed: isValidSize,
                score: isValidSize ? 100 : 0,
                details: {
                    actualSize,
                    declaredSize: metadata.fileSize,
                    maxSize,
                    minSize,
                    isValidSize,
                    matchesDeclaredSize,
                    sizePercentage: (actualSize / maxSize) * 100,
                },
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'size',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    async validateFileContent(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const detectedType = await (0, file_type_1.fileTypeFromBuffer)(fileBuffer);
            if (!detectedType) {
                return {
                    type: 'content',
                    passed: false,
                    score: 0,
                    details: {
                        error: 'Could not detect file type for content validation',
                    },
                    processingTime: Date.now() - startTime,
                };
            }
            let contentValid = false;
            let contentDetails = {};
            if (detectedType.mime === 'application/pdf') {
                contentDetails = await this.validatePDFContent(fileBuffer);
                contentValid = contentDetails.isValid;
            }
            else if (detectedType.mime.startsWith('image/')) {
                contentDetails = await this.validateImageContent(fileBuffer);
                contentValid = contentDetails.isValid;
            }
            return {
                type: 'content',
                passed: contentValid,
                score: contentValid ? 100 : 0,
                details: contentDetails,
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'content',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    async validatePDFContent(fileBuffer) {
        try {
            const pdfData = await (0, pdf_parse_1.default)(fileBuffer);
            return {
                isValid: pdfData.text.length > 0,
                pageCount: pdfData.numpages,
                textLength: pdfData.text.length,
                hasText: pdfData.text.length > 0,
                metadata: pdfData.metadata,
                info: pdfData.info,
                version: pdfData.version,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateImageContent(fileBuffer) {
        try {
            const image = (0, sharp_1.default)(fileBuffer);
            const metadata = await image.metadata();
            const isValidSize = metadata.width >= environment_config_1.config.validation.minImageWidth &&
                metadata.height >= environment_config_1.config.validation.minImageHeight &&
                metadata.width <= environment_config_1.config.validation.maxImageWidth &&
                metadata.height <= environment_config_1.config.validation.maxImageHeight;
            return {
                isValid: isValidSize,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                space: metadata.space,
                channels: metadata.channels,
                depth: metadata.depth,
                density: metadata.density,
                hasProfile: metadata.hasProfile,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation,
                isValidSize,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async validateBasicSecurity(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const isValidExtension = ['pdf', 'jpg', 'jpeg', 'png'].includes(metadata.originalFilename.split('.').pop()?.toLowerCase() || '');
            const isValidSize = fileBuffer.length > 0 && fileBuffer.length <= 50 * 1024 * 1024;
            const basicSecurityPassed = isValidExtension && isValidSize;
            return {
                type: 'basic_security',
                passed: basicSecurityPassed,
                score: basicSecurityPassed ? 100 : 0,
                details: {
                    isValidExtension,
                    isValidSize,
                    fileSize: fileBuffer.length,
                    filename: metadata.originalFilename,
                    riskLevel: basicSecurityPassed ? 'LOW' : 'MEDIUM',
                },
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'basic_security',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    async performOCRValidation(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            if (!environment_config_1.config.ocr.enabled || !this.tesseractWorker) {
                return {
                    type: 'ocr',
                    passed: true,
                    score: 100,
                    details: {
                        message: 'OCR disabled',
                    },
                    processingTime: Date.now() - startTime,
                };
            }
            let imageBuffer = fileBuffer;
            if (metadata.mimeType === 'application/pdf') {
                return {
                    type: 'ocr',
                    passed: true,
                    score: 80,
                    details: {
                        message: 'PDF OCR not implemented in this version',
                    },
                    processingTime: Date.now() - startTime,
                };
            }
            const { data: { text, confidence } } = await this.tesseractWorker.recognize(imageBuffer);
            const isValidConfidence = confidence >= environment_config_1.config.ocr.minConfidence * 100;
            const hasText = text.trim().length > 0;
            const extractedData = this.extractStructuredData(text, metadata);
            return {
                type: 'ocr',
                passed: isValidConfidence && hasText,
                score: isValidConfidence && hasText ? confidence : 0,
                details: {
                    text,
                    confidence,
                    hasText,
                    isValidConfidence,
                    extractedData,
                    textLength: text.length,
                    minConfidence: environment_config_1.config.ocr.minConfidence * 100,
                },
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'ocr',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    async validateDocumentSpecifics(fileBuffer, metadata) {
        const startTime = Date.now();
        try {
            const validationRules = metadata.validationRules || {};
            const specificChecks = {};
            if (metadata.categoryId === 'national_id') {
                specificChecks.nationalIdChecks = await this.validateNationalIdDocument(fileBuffer);
            }
            if (metadata.categoryId === 'commercial_registration') {
                specificChecks.crChecks = await this.validateCommercialRegistration(fileBuffer);
            }
            const allChecksPassed = Object.values(specificChecks).every((check) => check.isValid === true);
            return {
                type: 'document_specific',
                passed: allChecksPassed,
                score: allChecksPassed ? 100 : 50,
                details: {
                    validationRules,
                    specificChecks,
                    allChecksPassed,
                },
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                type: 'document_specific',
                passed: false,
                score: 0,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                processingTime: Date.now() - startTime,
            };
        }
    }
    extractStructuredData(text, metadata) {
        const extractedData = {
            rawText: text,
            fields: {},
        };
        if (metadata.categoryId === 'national_id') {
            const nationalIdRegex = /[12][0-9]{9}/g;
            const nationalIdMatch = text.match(nationalIdRegex);
            if (nationalIdMatch) {
                extractedData.fields.nationalId = nationalIdMatch[0];
            }
            const dateRegex = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/g;
            const dateMatches = text.match(dateRegex);
            if (dateMatches) {
                extractedData.fields.dates = dateMatches;
            }
        }
        if (metadata.categoryId === 'commercial_registration') {
            const crRegex = /[0-9]{10}/g;
            const crMatch = text.match(crRegex);
            if (crMatch) {
                extractedData.fields.registrationNumber = crMatch[0];
            }
        }
        return extractedData;
    }
    async validateNationalIdDocument(fileBuffer) {
        return {
            isValid: true,
            checks: {
                hasPhoto: false,
                hasHologram: false,
                hasNationalId: false,
                hasArabicText: false,
                hasEnglishText: false,
            },
        };
    }
    async validateCommercialRegistration(fileBuffer) {
        return {
            isValid: true,
            checks: {
                hasRegistrationNumber: false,
                hasCompanyName: false,
                hasIssueDate: false,
                hasExpiryDate: false,
                hasOfficialSeal: false,
            },
        };
    }
    calculateOverallScore(checks) {
        if (checks.length === 0)
            return 0;
        const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
        return Math.round(totalScore / checks.length);
    }
    calculateOverallConfidence(checks) {
        if (checks.length === 0)
            return 0;
        const passedChecks = checks.filter(check => check.passed);
        const confidence = (passedChecks.length / checks.length) * 100;
        return Math.round(confidence);
    }
    getHealthStatus() {
        return {
            status: 'healthy',
            details: {
                ocrEnabled: environment_config_1.config.ocr.enabled,
                tesseractReady: !!this.tesseractWorker,
                supportedFormats: environment_config_1.config.validation.allowedFormats,
                maxFileSize: environment_config_1.config.validation.maxFileSize,
            },
        };
    }
    async cleanup() {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
            this.tesseractWorker = null;
        }
    }
}
exports.DocumentValidationService = DocumentValidationService;
//# sourceMappingURL=document-validation.service.js.map