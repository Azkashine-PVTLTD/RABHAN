"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const uuid_1 = require("uuid");
require("express-async-errors");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
// Create Express app
const app = (0, express_1.default)();
// Trust proxy for correct IP detection
app.set('trust proxy', true);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Request-Time']
}));
// Compression for responses
app.use((0, compression_1.default)({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
}));
// Body parsing
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Add request ID for tracing
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.id);
    next();
});
// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            userId: req.user?.id,
            requestId: req.id
        });
    });
    next();
});
// Health check routes (before authentication)
app.use('/', health_routes_1.default);
// API routes
app.use('/api/users', user_routes_1.default);
// 404 handler
app.use(error_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.errorHandler);
// Server configuration
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';
// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
    try {
        // Close database connections
        await database_1.db.disconnect();
        // Close server
        server.close(() => {
            logger_1.logger.info('Server closed successfully');
            process.exit(0);
        });
        // Force exit after timeout
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown', error);
        process.exit(1);
    }
};
// Start server
const server = app.listen(PORT, HOST, async () => {
    try {
        // Connect to database
        await database_1.db.connect();
        logger_1.logger.info(`🚀 User Service started successfully`, {
            port: PORT,
            host: HOST,
            environment: process.env.NODE_ENV || 'development',
            version: process.env.SERVICE_VERSION || '1.0.0'
        });
        // Log service configuration
        logger_1.logger.info('Service configuration', {
            database: {
                host: process.env.DATABASE_HOST,
                name: process.env.DATABASE_NAME,
                poolMax: process.env.DATABASE_POOL_MAX
            },
            redis: {
                host: process.env.REDIS_HOST,
                db: process.env.REDIS_DB
            },
            auth: {
                serviceUrl: process.env.AUTH_SERVICE_URL
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
});
// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught exception', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled rejection', { reason, promise });
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map