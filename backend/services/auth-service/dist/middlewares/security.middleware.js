"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = exports.corsOptions = exports.samaCompliance = exports.sanitizeInput = exports.ipWhitelist = exports.requestLogger = exports.securityHeaders = exports.passwordResetRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_config_1 = require("../config/environment.config");
const logger_1 = require("../utils/logger");
// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger_1.SAMALogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', 'MEDIUM', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            res.status(429).json({ error: message });
        }
    });
};
exports.createRateLimiter = createRateLimiter;
// General rate limiter
exports.generalRateLimit = (0, exports.createRateLimiter)(environment_config_1.config.security.rateLimitWindowMs, environment_config_1.config.env === 'development' ? environment_config_1.config.security.rateLimitMaxRequests * 10 : environment_config_1.config.security.rateLimitMaxRequests, 'Too many requests from this IP');
// Strict rate limiter for auth endpoints (relaxed for development)
exports.authRateLimit = (0, exports.createRateLimiter)(15 * 60 * 1000, // 15 minutes
environment_config_1.config.env === 'development' ? 1000 : 100, // 1000 requests in development, 100 in production
'Too many authentication attempts');
// Password reset rate limiter
exports.passwordResetRateLimit = (0, exports.createRateLimiter)(60 * 60 * 1000, // 1 hour
5, // 5 requests per hour
'Too many password reset requests');
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // SAMA CSF security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    next();
};
exports.securityHeaders = securityHeaders;
// Request logging middleware for SAMA compliance
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.SAMALogger.logAuthEvent('API_REQUEST', undefined, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length')
        });
    });
    next();
};
exports.requestLogger = requestLogger;
// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!allowedIPs.includes(clientIP || '')) {
            logger_1.SAMALogger.logSecurityEvent('UNAUTHORIZED_IP_ACCESS', 'HIGH', {
                ip: clientIP,
                path: req.path,
                userAgent: req.get('User-Agent')
            });
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        next();
    };
};
exports.ipWhitelist = ipWhitelist;
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potential XSS attempts
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };
    if (req.body) {
        sanitizeObject(req.body);
    }
    if (req.query) {
        sanitizeObject(req.query);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
// SAMA compliance middleware
const samaCompliance = (req, res, next) => {
    // Log all requests for SAMA audit trail
    const auditData = {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    };
    logger_1.SAMALogger.logAuthEvent('SAMA_AUDIT_LOG', undefined, auditData);
    next();
};
exports.samaCompliance = samaCompliance;
// CORS configuration for SAMA compliance
exports.corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://rabhan.sa',
            'https://www.rabhan.sa',
            'https://admin.rabhan.sa',
            'https://contractor.rabhan.sa'
        ];
        // Add development origins
        if (environment_config_1.config.env === 'development') {
            allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173');
        }
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.SAMALogger.logSecurityEvent('CORS_VIOLATION', 'MEDIUM', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
// Request timeout middleware
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.SAMALogger.logSecurityEvent('REQUEST_TIMEOUT', 'LOW', {
                    path: req.path,
                    method: req.method,
                    timeout: timeoutMs
                });
                res.status(408).json({ error: 'Request timeout' });
            }
        }, timeoutMs);
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
//# sourceMappingURL=security.middleware.js.map