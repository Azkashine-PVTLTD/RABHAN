"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRedis = createMockRedis;
const logger_1 = require("./logger");
// Shared mock Redis store for development
const mockRedisStore = new Map();
function createMockRedis() {
    return {
        get: async (key) => {
            const value = mockRedisStore.get(key);
            logger_1.logger.info(`Mock Redis GET: ${key} = ${value || 'null'}`);
            return value || null;
        },
        setex: async (key, ttl, value) => {
            mockRedisStore.set(key, value);
            logger_1.logger.info(`Mock Redis SET: ${key} = ${value} (TTL: ${ttl}s)`);
            setTimeout(() => {
                mockRedisStore.delete(key);
                logger_1.logger.info(`Mock Redis EXPIRED: ${key}`);
            }, ttl * 1000);
        },
        del: async (key) => {
            mockRedisStore.delete(key);
            logger_1.logger.info(`Mock Redis DEL: ${key}`);
        }
    };
}
//# sourceMappingURL=mock-redis.js.map