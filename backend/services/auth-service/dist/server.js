"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const environment_config_1 = require("./config/environment.config");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
const logger_1 = require("./utils/logger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const security_middleware_1 = require("./middlewares/security.middleware");
class AuthServer {
    app;
    database;
    redis;
    constructor() {
        this.app = (0, express_1.default)();
        this.database = database_config_1.DatabaseConfig.getInstance();
        this.redis = redis_config_1.RedisConfig.getInstance();
        this.setupMiddlewares();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddlewares() {
        // Security headers
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));
        // Custom security headers
        this.app.use(security_middleware_1.securityHeaders);
        // CORS
        this.app.use((0, cors_1.default)(security_middleware_1.corsOptions));
        // Request timeout
        this.app.use((0, security_middleware_1.requestTimeout)(30000));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Rate limiting
        this.app.use(security_middleware_1.generalRateLimit);
        // Input sanitization
        this.app.use(security_middleware_1.sanitizeInput);
        // SAMA compliance logging
        this.app.use(security_middleware_1.samaCompliance);
        // Request logging
        this.app.use(security_middleware_1.requestLogger);
        // Trust proxy (for accurate IP addresses)
        this.app.set('trust proxy', 1);
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'auth-service',
                timestamp: new Date().toISOString(),
                environment: environment_config_1.config.env,
                version: '1.0.0'
            });
        });
        // API routes
        this.app.use('/api/auth', auth_routes_1.default);
        // 404 handler
        this.app.use('*', (req, res) => {
            logger_1.SAMALogger.logSecurityEvent('ENDPOINT_NOT_FOUND', 'LOW', {
                path: req.originalUrl,
                method: req.method,
                ip: req.ip
            });
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl
            });
        });
    }
    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            logger_1.logger.error('Unhandled error:', err);
            logger_1.SAMALogger.logSecurityEvent('UNHANDLED_ERROR', 'HIGH', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
                ip: req.ip
            });
            // Don't leak error details in production
            if (environment_config_1.config.isProduction) {
                res.status(500).json({
                    error: 'Internal server error',
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(500).json({
                    error: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                });
            }
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            logger_1.logger.error('Uncaught Exception:', err);
            logger_1.SAMALogger.logSecurityEvent('UNCAUGHT_EXCEPTION', 'CRITICAL', {
                error: err.message,
                stack: err.stack
            });
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            logger_1.SAMALogger.logSecurityEvent('UNHANDLED_REJECTION', 'CRITICAL', {
                reason: reason instanceof Error ? reason.message : reason,
                stack: reason instanceof Error ? reason.stack : undefined
            });
            process.exit(1);
        });
    }
    async initializeConnections() {
        try {
            // Test database connection
            const dbHealth = await this.database.testConnection();
            if (!dbHealth) {
                throw new Error('Database connection failed');
            }
            logger_1.logger.info('Database connection established');
            // Connect to Redis
            await this.redis.connect();
            const redisHealth = await this.redis.healthCheck();
            if (!redisHealth) {
                throw new Error('Redis connection failed');
            }
            logger_1.logger.info('Redis connection established');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize connections:', error);
            throw error;
        }
    }
    async start() {
        try {
            // Validate configuration
            (0, environment_config_1.validateConfig)();
            logger_1.logger.info('Configuration validated');
            // Initialize connections
            await this.initializeConnections();
            // Start server
            const server = this.app.listen(environment_config_1.config.server.port, () => {
                logger_1.logger.info(`Auth service running on port ${environment_config_1.config.server.port}`);
                logger_1.logger.info(`Environment: ${environment_config_1.config.env}`);
                logger_1.logger.info(`SAMA compliance mode: ${environment_config_1.config.sama.complianceMode}`);
                logger_1.SAMALogger.logAuthEvent('SERVICE_STARTED', undefined, {
                    port: environment_config_1.config.server.port,
                    environment: environment_config_1.config.env,
                    complianceMode: environment_config_1.config.sama.complianceMode
                });
            });
            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown(server));
            process.on('SIGINT', () => this.shutdown(server));
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async shutdown(server) {
        logger_1.logger.info('Shutting down server...');
        logger_1.SAMALogger.logAuthEvent('SERVICE_SHUTDOWN', undefined, {
            timestamp: new Date().toISOString()
        });
        server.close(async () => {
            try {
                await this.database.closePool();
                await this.redis.disconnect();
                logger_1.logger.info('Connections closed');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        });
    }
}
// Start the server
const server = new AuthServer();
server.start().catch((error) => {
    logger_1.logger.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map