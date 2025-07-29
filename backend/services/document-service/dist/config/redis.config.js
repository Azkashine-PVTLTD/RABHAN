"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConfig = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_config_1 = require("./environment.config");
const logger_1 = require("../utils/logger");
class RedisConfig {
    static instance;
    client;
    isConnected = false;
    constructor() {
        this.client = new ioredis_1.default(environment_config_1.config.redis.url, {
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keyPrefix: environment_config_1.config.redis.prefix,
            connectTimeout: 10000,
            commandTimeout: 5000,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                logger_1.logger.warn(`Redis retry attempt ${times}, delay: ${delay}ms`);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                return err.message.includes(targetError);
            },
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!RedisConfig.instance) {
            RedisConfig.instance = new RedisConfig();
        }
        return RedisConfig.instance;
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => {
            logger_1.logger.info('Redis client ready');
        });
        this.client.on('error', (err) => {
            logger_1.logger.error('Redis client error:', {
                error: err.message,
                stack: err.stack,
            });
            this.isConnected = false;
        });
        this.client.on('close', () => {
            logger_1.logger.warn('Redis client connection closed');
            this.isConnected = false;
        });
        this.client.on('reconnecting', (ms) => {
            logger_1.logger.info(`Redis client reconnecting in ${ms}ms`);
        });
        this.client.on('end', () => {
            logger_1.logger.warn('Redis client connection ended');
            this.isConnected = false;
        });
    }
    getClient() {
        return this.client;
    }
    async connect() {
        try {
            await this.client.connect();
            const pong = await this.client.ping();
            if (pong === 'PONG') {
                logger_1.logger.info('Redis connected successfully');
                this.isConnected = true;
            }
            else {
                throw new Error('Redis ping failed');
            }
        }
        catch (error) {
            logger_1.logger.error('Redis connection failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.client.quit();
            this.isConnected = false;
            logger_1.logger.info('Redis disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Redis disconnection failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            const pong = await this.client.ping();
            const responseTime = Date.now() - startTime;
            if (pong === 'PONG') {
                const [memory, stats] = await Promise.all([
                    this.client.memory('usage'),
                    this.client.info('stats'),
                ]);
                return {
                    status: 'healthy',
                    details: {
                        connected: this.isConnected,
                        responseTime,
                        memory,
                        stats: this.parseRedisInfo(stats),
                    },
                };
            }
            else {
                throw new Error('Redis ping failed');
            }
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                details: {
                    connected: false,
                    responseTime: Date.now() - startTime,
                },
            };
        }
    }
    async createUploadSession(sessionId, userId, metadata) {
        const key = `upload_session:${sessionId}`;
        const data = {
            userId,
            metadata,
            createdAt: new Date().toISOString(),
            status: 'active',
        };
        await this.client.setex(key, 3600, JSON.stringify(data));
        logger_1.logger.debug('Upload session created', { sessionId, userId });
    }
    async getUploadSession(sessionId) {
        const key = `upload_session:${sessionId}`;
        const data = await this.client.get(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }
    async updateUploadSession(sessionId, updates) {
        const key = `upload_session:${sessionId}`;
        const existingData = await this.getUploadSession(sessionId);
        if (existingData) {
            const updatedData = {
                ...existingData,
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            await this.client.setex(key, 3600, JSON.stringify(updatedData));
            logger_1.logger.debug('Upload session updated', { sessionId, updates });
        }
    }
    async deleteUploadSession(sessionId) {
        const key = `upload_session:${sessionId}`;
        await this.client.del(key);
        logger_1.logger.debug('Upload session deleted', { sessionId });
    }
    async cacheValidationResult(fileHash, validationResult) {
        const key = `validation:${fileHash}`;
        await this.client.setex(key, environment_config_1.config.redis.keyExpiry, JSON.stringify(validationResult));
        logger_1.logger.debug('Validation result cached', { fileHash });
    }
    async getValidationResult(fileHash) {
        const key = `validation:${fileHash}`;
        const data = await this.client.get(key);
        if (data) {
            logger_1.logger.debug('Validation result retrieved from cache', { fileHash });
            return JSON.parse(data);
        }
        return null;
    }
    async checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
        const key = `rate_limit:${userId}`;
        const current = await this.client.get(key);
        if (!current) {
            await this.client.setex(key, Math.ceil(windowMs / 1000), '1');
            return {
                allowed: true,
                remainingRequests: maxRequests - 1,
                resetTime: Date.now() + windowMs,
            };
        }
        const count = parseInt(current, 10);
        if (count >= maxRequests) {
            const ttl = await this.client.ttl(key);
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: Date.now() + (ttl * 1000),
            };
        }
        await this.client.incr(key);
        return {
            allowed: true,
            remainingRequests: maxRequests - count - 1,
            resetTime: Date.now() + windowMs,
        };
    }
    async enqueueDocument(documentId, processingType, priority = 'medium') {
        const queueKey = `processing_queue:${processingType}`;
        const data = {
            documentId,
            priority,
            enqueuedAt: new Date().toISOString(),
        };
        const score = this.getPriorityScore(priority);
        await this.client.zadd(queueKey, score, JSON.stringify(data));
        logger_1.logger.debug('Document enqueued for processing', {
            documentId,
            processingType,
            priority,
        });
    }
    async dequeueDocument(processingType) {
        const queueKey = `processing_queue:${processingType}`;
        const result = await this.client.zpopmin(queueKey);
        if (result.length >= 2) {
            const data = JSON.parse(result[1]);
            logger_1.logger.debug('Document dequeued for processing', {
                documentId: data.documentId,
                processingType,
            });
            return data;
        }
        return null;
    }
    async cacheAuditEvent(eventId, eventData, ttl = 86400) {
        const key = `audit_event:${eventId}`;
        await this.client.setex(key, ttl, JSON.stringify(eventData));
    }
    async getAuditEvent(eventId) {
        const key = `audit_event:${eventId}`;
        const data = await this.client.get(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }
    async acquireLock(lockKey, ttl = 300) {
        const key = `lock:${lockKey}`;
        const result = await this.client.set(key, '1', 'EX', ttl, 'NX');
        if (result === 'OK') {
            logger_1.logger.debug('Lock acquired', { lockKey, ttl });
            return true;
        }
        return false;
    }
    async releaseLock(lockKey) {
        const key = `lock:${lockKey}`;
        await this.client.del(key);
        logger_1.logger.debug('Lock released', { lockKey });
    }
    getPriorityScore(priority) {
        switch (priority) {
            case 'high': return 1;
            case 'medium': return 5;
            case 'low': return 10;
            default: return 5;
        }
    }
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const parsed = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                parsed[key] = isNaN(Number(value)) ? value : Number(value);
            }
        }
        return parsed;
    }
    isHealthy() {
        return this.isConnected;
    }
}
exports.RedisConfig = RedisConfig;
//# sourceMappingURL=redis.config.js.map