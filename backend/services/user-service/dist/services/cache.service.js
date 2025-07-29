"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class CacheService {
    redis;
    prefix;
    defaultTTL;
    constructor() {
        this.prefix = process.env.REDIS_KEY_PREFIX || 'rabhan:user:';
        this.defaultTTL = parseInt(process.env.REDIS_TTL || '300', 10);
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '1', 10),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        });
        this.redis.on('error', (error) => {
            logger_1.logger.error('Redis connection error', error);
        });
        this.redis.on('connect', () => {
            logger_1.logger.info('Redis connected successfully');
        });
    }
    // User profile caching
    async getUserProfile(userId) {
        try {
            const key = `${this.prefix}profile:${userId}`;
            const cached = await this.redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', error);
            return null; // Fail gracefully
        }
    }
    async setUserProfile(userId, profile, ttl) {
        try {
            const key = `${this.prefix}profile:${userId}`;
            const value = JSON.stringify(profile);
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.setex(key, this.defaultTTL, value);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache set error', error);
            // Fail gracefully - cache is not critical
        }
    }
    async invalidateUserProfile(userId) {
        try {
            const key = `${this.prefix}profile:${userId}`;
            await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache invalidate error', error);
        }
    }
    // BNPL eligibility caching
    async getBNPLEligibility(userId) {
        try {
            const key = `${this.prefix}bnpl:${userId}`;
            const cached = await this.redis.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', error);
            return null;
        }
    }
    async setBNPLEligibility(userId, eligibility, ttl = 3600) {
        try {
            const key = `${this.prefix}bnpl:${userId}`;
            const value = JSON.stringify(eligibility);
            await this.redis.setex(key, ttl, value);
        }
        catch (error) {
            logger_1.logger.error('Cache set error', error);
        }
    }
    async invalidateBNPLEligibility(userId) {
        try {
            const key = `${this.prefix}bnpl:${userId}`;
            await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache invalidate error', error);
        }
    }
    // Batch operations
    async invalidateUserData(userId) {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.del(`${this.prefix}profile:${userId}`);
            pipeline.del(`${this.prefix}bnpl:${userId}`);
            await pipeline.exec();
        }
        catch (error) {
            logger_1.logger.error('Cache batch invalidate error', error);
        }
    }
    // Health check
    async isHealthy() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    // Cleanup
    async disconnect() {
        await this.redis.quit();
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cache.service.js.map