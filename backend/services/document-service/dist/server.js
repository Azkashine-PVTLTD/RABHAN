"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const environment_config_1 = require("./config/environment.config");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
const minio_config_1 = require("./config/minio.config");
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const kyc_routes_1 = __importDefault(require("./routes/kyc.routes"));
const logger_1 = require("./utils/logger");
class DocumentService {
    app;
    database;
    redis;
    minio;
    constructor() {
        this.app = (0, express_1.default)();
        this.database = database_config_1.DatabaseConfig.getInstance();
        this.redis = redis_config_1.RedisConfig.getInstance();
        this.minio = minio_config_1.MinioConfig.getInstance();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        this.app.use((0, cors_1.default)({
            origin: environment_config_1.config.server.allowedOrigins.split(','),
            credentials: true,
            optionsSuccessStatus: 200,
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.set('trust proxy', 1);
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.headers['x-request-id'] = requestId;
            res.setHeader('X-Request-ID', requestId);
            const originalSend = res.send;
            res.send = function (body) {
                const responseTime = Date.now() - startTime;
                logger_1.logger.info('HTTP Request', {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime,
                    requestId,
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                });
                return originalSend.call(this, body);
            };
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                service: environment_config_1.config.server.serviceName,
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: environment_config_1.config.env,
            });
        });
        this.app.use('/api/documents', document_routes_1.default);
        this.app.use('/api/kyc', kyc_routes_1.default);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
                code: 'NOT_FOUND',
                path: req.originalUrl,
            });
        });
    }
    initializeErrorHandling() {
        this.app.use((error, req, res, next) => {
            logger_1.logger.error('Unhandled application error:', {
                error: error.message,
                stack: error.stack,
                requestId: req.headers['x-request-id'],
                url: req.url,
                method: req.method,
                ip: req.ip,
            });
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                requestId: req.headers['x-request-id'],
            });
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught exception:', {
                error: error.message,
                stack: error.stack,
            });
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled promise rejection:', {
                reason,
                promise,
            });
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }
    async shutdown() {
        try {
            logger_1.logger.info('Starting graceful shutdown');
            if (this.database && typeof this.database.close === 'function') {
                await this.database.close();
            }
            if (process.env.REDIS_ENABLED !== 'false') {
                try {
                    if (this.redis && typeof this.redis.close === 'function') {
                        await this.redis.close();
                    }
                }
                catch (error) {
                    logger_1.logger.warn('Redis close failed (may not be connected)');
                }
            }
            logger_1.logger.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            process.exit(1);
        }
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Document Service');
            await this.database.connect();
            logger_1.logger.info('Database connected successfully');
            if (process.env.REDIS_ENABLED !== 'false') {
                try {
                    await this.redis.connect();
                    logger_1.logger.info('Redis connected successfully');
                }
                catch (error) {
                    logger_1.logger.warn('Redis connection failed, continuing without Redis');
                }
            }
            else {
                logger_1.logger.info('Redis skipped (disabled in development)');
            }
            if (process.env.MINIO_ENABLED !== 'false') {
                try {
                    await this.minio.connect();
                    logger_1.logger.info('MinIO connected successfully');
                }
                catch (error) {
                    logger_1.logger.warn('MinIO connection failed, continuing with local storage');
                }
            }
            else {
                logger_1.logger.info('MinIO skipped (using local storage)');
            }
            if (this.database && typeof this.database.runMigrations === 'function') {
                await this.database.runMigrations();
                logger_1.logger.info('Database migrations completed');
            }
            else {
                logger_1.logger.info('Database migrations method not available');
            }
            logger_1.logger.info('Document Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Document Service:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async start() {
        try {
            await this.initialize();
            const server = this.app.listen(environment_config_1.config.server.port, () => {
                logger_1.logger.info(`Document Service started successfully`, {
                    serviceName: environment_config_1.config.server.serviceName,
                    port: environment_config_1.config.server.port,
                    environment: environment_config_1.config.env,
                    processId: process.pid,
                    nodeVersion: process.version,
                });
            });
            server.on('close', () => {
                logger_1.logger.info('HTTP server closed');
            });
            return new Promise((resolve, reject) => {
                server.on('listening', resolve);
                server.on('error', reject);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start Document Service:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            process.exit(1);
        }
    }
}
const documentService = new DocumentService();
if (require.main === module) {
    documentService.start().catch((error) => {
        logger_1.logger.error('Failed to start Document Service:', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
    });
}
exports.default = documentService;
//# sourceMappingURL=server.js.map