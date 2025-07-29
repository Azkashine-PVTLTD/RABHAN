"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DatabaseConfig = void 0;
const pg_1 = require("pg");
const fs_1 = require("fs");
const logger_1 = require("../utils/logger");
// Database configuration optimized for Saudi scale and performance
class DatabaseConfig {
    static instance;
    pool = null;
    config;
    constructor() {
        this.config = {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432', 10),
            database: process.env.DATABASE_NAME || 'rabhan_user',
            user: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || '12345',
            // Connection pool settings for high performance
            min: parseInt(process.env.DATABASE_POOL_MIN || '10', 10),
            max: parseInt(process.env.DATABASE_POOL_MAX || '50', 10),
            idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '15000', 10),
            connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000', 10),
            // SSL configuration for production
            ssl: process.env.DATABASE_SSL === 'true' ? {
                rejectUnauthorized: false,
                ca: process.env.DATABASE_CA_CERT ? (0, fs_1.readFileSync)(process.env.DATABASE_CA_CERT).toString() : undefined
            } : false,
            // Query timeout for SAMA compliance
            statement_timeout: 2000, // 2 seconds max query time
            query_timeout: 2000,
            // Application name for monitoring
            application_name: `${process.env.SERVICE_NAME}-${process.env.NODE_ENV}`
        };
    }
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    async connect() {
        if (this.pool) {
            return this.pool;
        }
        try {
            this.pool = new pg_1.Pool(this.config);
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            logger_1.logger.info('Database connected successfully', {
                host: this.config.host,
                database: this.config.database,
                poolSize: this.config.max
            });
            // Set up error handlers
            this.pool.on('error', (err) => {
                logger_1.logger.error('Unexpected database error', err);
            });
            this.pool.on('connect', () => {
                logger_1.logger.debug('New database connection established');
            });
            this.pool.on('acquire', () => {
                logger_1.logger.debug('Database connection acquired from pool');
            });
            this.pool.on('remove', () => {
                logger_1.logger.debug('Database connection removed from pool');
            });
            return this.pool;
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger_1.logger.info('Database disconnected');
        }
    }
    getPool() {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.pool;
    }
    // Performance monitoring
    async getPoolStats() {
        if (!this.pool) {
            return null;
        }
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    }
}
exports.DatabaseConfig = DatabaseConfig;
// Export singleton instance
exports.db = DatabaseConfig.getInstance();
//# sourceMappingURL=database.js.map