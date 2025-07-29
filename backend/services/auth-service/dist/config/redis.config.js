"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConfig = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const environment_config_1 = require("./environment.config");
class RedisConfig {
    static instance;
    client;
    constructor() {
        if (environment_config_1.config.env === 'development') {
            // Mock Redis for development
            this.client = null;
            return;
        }
        this.client = new ioredis_1.default(environment_config_1.config.redis.url, {
            keyPrefix: environment_config_1.config.redis.prefix,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 1,
            enableReadyCheck: true,
            lazyConnect: true,
            connectTimeout: 10000,
            commandTimeout: 2000,
            keepAlive: 10000
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!RedisConfig.instance) {
            RedisConfig.instance = new RedisConfig();
        }
        return RedisConfig.instance;
    }
    getClient() {
        return this.client;
    }
    setupEventHandlers() {
        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });
        this.client.on('connect', () => {
            console.log('Redis connected');
        });
        this.client.on('ready', () => {
            console.log('Redis ready');
        });
        this.client.on('close', () => {
            console.log('Redis connection closed');
        });
    }
    async connect() {
        if (environment_config_1.config.env === 'development') {
            console.log('Redis connection skipped in development mode');
            return;
        }
        await this.client.connect();
    }
    async disconnect() {
        if (environment_config_1.config.env === 'development') {
            return;
        }
        await this.client.quit();
    }
    async healthCheck() {
        if (environment_config_1.config.env === 'development') {
            console.log('Redis health check skipped in development mode');
            return true;
        }
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
}
exports.RedisConfig = RedisConfig;
//# sourceMappingURL=redis.config.js.map