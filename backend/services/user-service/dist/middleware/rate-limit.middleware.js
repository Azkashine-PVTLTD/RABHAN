"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRateLimit = exports.adminRateLimit = exports.bnplRateLimit = exports.updateRateLimit = exports.createRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
// Create rate limiter configurations
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise IP
            return req.user?.id || req.ip;
        },
        handler: (req, res) => {
            logger_1.logger.warn('Rate limit exceeded', {
                userId: req.user?.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method
            });
            res.status(429).json({
                success: false,
                error: options.message,
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }
    });
};
// General API rate limiting
exports.generalRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later'
});
// Strict rate limiting for create operations
exports.createRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 creates per minute
    message: 'Too many create requests, please try again later'
});
// Profile update rate limiting
exports.updateRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 updates per minute
    message: 'Too many update requests, please try again later'
});
// BNPL eligibility check rate limiting
exports.bnplRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 checks per minute
    message: 'Too many BNPL eligibility checks, please try again later'
});
// Admin operations rate limiting
exports.adminRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 admin operations per minute
    message: 'Too many admin requests, please try again later'
});
// Document operations rate limiting
exports.documentRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 document operations per minute
    message: 'Too many document requests, please try again later'
});
//# sourceMappingURL=rate-limit.middleware.js.map