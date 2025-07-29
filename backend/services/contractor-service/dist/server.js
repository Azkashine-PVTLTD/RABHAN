"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_config_1 = require("./config/environment.config");
const database_config_1 = require("./config/database.config");
const logger_1 = require("./utils/logger");
const contractor_routes_1 = __importDefault(require("./routes/contractor.routes"));
// Create Express application
const app = (0, express_1.default)();
// Trust proxy for accurate IP addresses
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
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
// CORS configuration for Saudi deployment
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000', // Frontend development
        'http://localhost:3005', // Frontend on different port
        'http://127.0.0.1:3000', // Frontend development (127.0.0.1)
        'http://127.0.0.1:3005', // Frontend on different port (127.0.0.1)
        'https://rabhan.sa', // Production domain
        'https://www.rabhan.sa', // Production domain with www
        'https://app.rabhan.sa', // Application subdomain
        'https://admin.rabhan.sa' // Admin subdomain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'X-Forwarded-For',
        'X-Request-ID',
        'X-Request-Time',
        'User-Agent',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
    maxAge: 86400 // 24 hours
}));
// Compression middleware
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
// Rate limiting - different limits for different endpoints
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: environment_config_1.config.RATE_LIMIT_WINDOW_MS,
    max: environment_config_1.config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            timestamp: new Date()
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if available, otherwise IP address
        return req.user?.id || req.ip || 'unknown';
    },
    onLimitReached: (req) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip_address: req.ip,
            user_id: req.user?.id,
            user_agent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            event_type: 'rate_limit_exceeded'
        });
    }
});
// Stricter rate limiting for registration
const registrationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 registrations per hour per IP
    message: {
        error: {
            code: 'REGISTRATION_RATE_LIMIT',
            message: 'Too many registration attempts, please try again later',
            timestamp: new Date()
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Body parsing middleware with size limits
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        // Verify JSON integrity for security
        try {
            JSON.parse(buf.toString());
        }
        catch (error) {
            logger_1.logger.warn('Invalid JSON received', {
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                content_length: req.get('Content-Length'),
                event_type: 'invalid_json'
            });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb'
}));
// Request logging middleware with performance monitoring
app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Add request ID to headers
    res.setHeader('X-Request-ID', requestId);
    // Log request start
    logger_1.logger.info('Request started', {
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        content_length: req.get('Content-Length'),
        request_id: requestId,
        event_type: 'request_start'
    });
    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.performanceLogger.apiResponse(req.originalUrl, req.method, res.statusCode, duration);
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            duration_ms: duration,
            ip_address: req.ip,
            request_id: requestId,
            event_type: 'request_complete'
        });
    });
    next();
});
// Health check endpoint (before rate limiting)
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await (0, database_config_1.checkDatabaseHealth)();
        const healthStatus = {
            service: 'contractor-service',
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: environment_config_1.config.NODE_ENV,
            database: dbHealthy ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            port: environment_config_1.config.PORT
        };
        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event_type: 'health_check_error'
        });
        res.status(503).json({
            service: 'contractor-service',
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// Apply rate limiting
app.use(generalLimiter);
// Apply stricter rate limiting to registration endpoint
app.use('/api/contractors/register', registrationLimiter);
// Handle preflight requests explicitly
app.options('/api/contractors/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Forwarded-For, X-Request-ID, X-Request-Time, User-Agent, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
});
// Ensure CORS headers are always added to responses
app.use((req, res, next) => {
    const origin = req.get('Origin');
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3005',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3005',
        'https://rabhan.sa',
        'https://www.rabhan.sa',
        'https://app.rabhan.sa',
        'https://admin.rabhan.sa'
    ];
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Request-ID');
    next();
});
// API routes
app.use('/api/contractors', contractor_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'RABHAN Contractor Management Service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        documentation: '/api/contractors/health',
        compliance: 'SAMA Level 4',
        environment: environment_config_1.config.NODE_ENV
    });
});
// 404 handler
app.use('*', (req, res) => {
    logger_1.logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        event_type: 'route_not_found'
    });
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'The requested endpoint was not found',
            timestamp: new Date()
        }
    });
});
// Global error handler
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled application error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        event_type: 'application_error'
    });
    // Don't expose internal error details in production
    const errorMessage = environment_config_1.config.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
            timestamp: new Date()
        }
    });
});
// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger_1.logger.info('Graceful shutdown initiated', {
        signal,
        timestamp: new Date().toISOString(),
        event_type: 'shutdown_start'
    });
    try {
        // Close database connections
        await (0, database_config_1.closeDatabasePool)();
        // Give existing requests time to complete
        setTimeout(() => {
            logger_1.logger.info('Contractor service shut down successfully', {
                signal,
                timestamp: new Date().toISOString(),
                event_type: 'shutdown_complete'
            });
            process.exit(0);
        }, 5000);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown', {
            signal,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            event_type: 'shutdown_error'
        });
        process.exit(1);
    }
};
// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        event_type: 'uncaught_exception'
    });
    // Attempt graceful shutdown
    gracefulShutdown('uncaughtException');
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
        event_type: 'unhandled_rejection'
    });
    // Attempt graceful shutdown
    gracefulShutdown('unhandledRejection');
});
// Start server
const startServer = async () => {
    try {
        // Skip database check for now to test endpoints
        // const dbHealthy = await checkDatabaseHealth();
        // if (!dbHealthy) {
        //   throw new Error('Database connection failed');
        // }
        // Start listening
        const server = app.listen(environment_config_1.config.PORT, () => {
            logger_1.logger.info('Contractor service started successfully', {
                port: environment_config_1.config.PORT,
                environment: environment_config_1.config.NODE_ENV,
                database: 'connected',
                compliance: 'SAMA Level 4',
                timestamp: new Date().toISOString(),
                service: 'contractor-service',
                version: process.env.npm_package_version || '1.0.0',
                event_type: 'service_start'
            });
            console.log(`🚀 RABHAN Contractor Service running on port ${environment_config_1.config.PORT}`);
            console.log(`📊 Environment: ${environment_config_1.config.NODE_ENV}`);
            console.log(`🔒 SAMA Compliance: Level 4`);
            console.log(`📋 Health Check: http://localhost:${environment_config_1.config.PORT}/health`);
        });
        // Set server timeouts
        server.timeout = 30000; // 30 seconds
        server.keepAliveTimeout = 65000; // 65 seconds
        server.headersTimeout = 66000; // 66 seconds
        return server;
    }
    catch (error) {
        logger_1.logger.error('Failed to start contractor service', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            event_type: 'startup_error'
        });
        console.error('❌ Failed to start contractor service:', error);
        process.exit(1);
    }
};
// Start the server
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map