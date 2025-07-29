"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.authenticate = exports.corsMiddleware = exports.requestLogger = exports.requestId = exports.securityHeaders = exports.uploadRateLimit = exports.validateUploadRequest = exports.handleUploadError = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const environment_config_1 = require("../config/environment.config");
const logger_1 = require("../utils/logger");
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: environment_config_1.config.server.maxFileSize,
        files: 1,
        fields: 10,
    },
});
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        logger_1.logger.error('Multer upload error:', {
            error: error.message,
            code: error.code,
            field: error.field,
            requestId: req.headers['x-request-id'],
        });
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                res.status(400).json({
                    success: false,
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE',
                    maxSize: environment_config_1.config.server.maxFileSize,
                });
                break;
            case 'LIMIT_FILE_COUNT':
                res.status(400).json({
                    success: false,
                    error: 'Too many files',
                    code: 'TOO_MANY_FILES',
                    maxFiles: 1,
                });
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                res.status(400).json({
                    success: false,
                    error: 'Unexpected file field',
                    code: 'UNEXPECTED_FILE',
                });
                break;
            default:
                res.status(400).json({
                    success: false,
                    error: 'File upload error',
                    code: 'UPLOAD_ERROR',
                });
        }
    }
    else if (error.message.includes('File type')) {
        logger_1.logger.error('File type error:', {
            error: error.message,
            requestId: req.headers['x-request-id'],
        });
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'INVALID_FILE_TYPE',
            allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        });
    }
    else {
        next(error);
    }
};
exports.handleUploadError = handleUploadError;
const validateUploadRequest = (req, res, next) => {
    console.log('🔍 Validating upload request:');
    console.log('📋 Body:', req.body);
    console.log('📁 File:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    } : 'No file');
    const { userId, categoryId } = req.body;
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: userId',
            code: 'MISSING_USER_ID',
        });
    }
    if (!categoryId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: categoryId',
            code: 'MISSING_CATEGORY_ID',
        });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid userId format',
            code: 'INVALID_USER_ID',
        });
    }
    const categoryUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const categoryRegex = /^[a-z0-9_]+$/;
    if (!categoryUuidRegex.test(categoryId) && !categoryRegex.test(categoryId)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid categoryId format (must be UUID or alphanumeric)',
            code: 'INVALID_CATEGORY_ID',
        });
    }
    next();
};
exports.validateUploadRequest = validateUploadRequest;
const uploadRateLimit = (req, res, next) => {
    const userUploadCount = uploadCounts.get(req.body.userId) || 0;
    const currentTime = Date.now();
    if (currentTime - lastReset > 3600000) {
        uploadCounts.clear();
        lastReset = currentTime;
    }
    if (userUploadCount >= environment_config_1.config.server.maxUploadsPerHour) {
        logger_1.logger.warn('Upload rate limit exceeded', {
            userId: req.body.userId,
            count: userUploadCount,
            limit: environment_config_1.config.server.maxUploadsPerHour,
            requestId: req.headers['x-request-id'],
        });
        return res.status(429).json({
            success: false,
            error: 'Upload rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            limit: environment_config_1.config.server.maxUploadsPerHour,
            resetTime: new Date(lastReset + 3600000).toISOString(),
        });
    }
    uploadCounts.set(req.body.userId, userUploadCount + 1);
    next();
};
exports.uploadRateLimit = uploadRateLimit;
const uploadCounts = new Map();
let lastReset = Date.now();
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
const requestId = (req, res, next) => {
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};
exports.requestId = requestId;
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    logger_1.logger.info('Request started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        requestId: req.headers['x-request-id'],
        userId: req.body?.userId,
        ip: req.ip,
    });
    const originalJson = res.json;
    res.json = function (body) {
        const responseTime = Date.now() - startTime;
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            requestId: req.headers['x-request-id'],
            userId: req.body?.userId,
            success: body?.success,
        });
        return originalJson.call(this, body);
    };
    next();
};
exports.requestLogger = requestLogger;
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = environment_config_1.config.server.allowedOrigins.split(',').map(origin => origin.trim());
    const origin = req.get('origin');
    if (environment_config_1.config.isDevelopment) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    else if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
const authenticate = (req, res, next) => {
    if (environment_config_1.config.isDevelopment) {
        next();
        return;
    }
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header',
            code: 'UNAUTHORIZED',
        });
    }
    const token = authHeader.substring(7);
    if (token) {
        next();
    }
    else {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
    }
};
exports.authenticate = authenticate;
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.headers['x-request-id'],
        userId: req.body?.userId,
        url: req.url,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: req.headers['x-request-id'],
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=upload.middleware.js.map