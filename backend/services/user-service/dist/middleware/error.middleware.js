"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    const correlationId = req.id || 'unknown';
    // Log error with context
    logger_1.logger.error('Request error', {
        error: error.message,
        stack: error.stack,
        correlationId,
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    // Handle specific error types
    if (error instanceof types_1.UserServiceError) {
        // Log compliance violations
        if (error instanceof types_1.ComplianceError) {
            (0, logger_1.logAudit)('COMPLIANCE_VIOLATION', {
                error: error.message,
                details: error.details,
                correlationId
            }, req.user?.id);
        }
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            metadata: {
                timestamp: new Date().toISOString(),
                correlationId,
                service: 'user-service'
            }
        });
    }
    // Handle validation errors (Joi)
    if (error.name === 'ValidationError') {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.message,
            metadata: {
                timestamp: new Date().toISOString(),
                correlationId,
                service: 'user-service'
            }
        });
    }
    // Handle database errors
    if (error.name === 'DatabaseError' || error.message.includes('duplicate key')) {
        return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            success: false,
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
            metadata: {
                timestamp: new Date().toISOString(),
                correlationId,
                service: 'user-service'
            }
        });
    }
    // Handle timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return res.status(http_status_codes_1.StatusCodes.REQUEST_TIMEOUT).json({
            success: false,
            error: 'Request timeout',
            code: 'TIMEOUT_ERROR',
            metadata: {
                timestamp: new Date().toISOString(),
                correlationId,
                service: 'user-service'
            }
        });
    }
    // Handle rate limiting
    if (error.message.includes('rate limit')) {
        return res.status(http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS).json({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_ERROR',
            metadata: {
                timestamp: new Date().toISOString(),
                correlationId,
                service: 'user-service'
            }
        });
    }
    // Default error response
    return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        code: 'INTERNAL_ERROR',
        metadata: {
            timestamp: new Date().toISOString(),
            correlationId,
            service: 'user-service'
        }
    });
};
exports.errorHandler = errorHandler;
// 404 handler
const notFoundHandler = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        metadata: {
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            service: 'user-service'
        }
    });
};
exports.notFoundHandler = notFoundHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map