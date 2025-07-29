"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const pg_1 = require("pg");
const environment_config_1 = require("./environment.config");
const logger_1 = require("../utils/logger");
class DatabaseConfig {
    static instance;
    pool;
    isConnected = false;
    constructor() {
        const poolConfig = {
            connectionString: environment_config_1.config.database.url,
            min: environment_config_1.config.database.poolMin,
            max: environment_config_1.config.database.poolMax,
            connectionTimeoutMillis: environment_config_1.config.database.connectionTimeout,
            idleTimeoutMillis: environment_config_1.config.database.idleTimeout,
            allowExitOnIdle: false,
            ssl: environment_config_1.config.isProduction ? {
                rejectUnauthorized: false,
                ca: process.env.DATABASE_SSL_CA,
                key: process.env.DATABASE_SSL_KEY,
                cert: process.env.DATABASE_SSL_CERT,
            } : false,
        };
        this.pool = new pg_1.Pool(poolConfig);
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            logger_1.logger.info('Database client connected', {
                processId: client.processID,
                database: this.getDatabaseName(),
            });
        });
        this.pool.on('acquire', (client) => {
            logger_1.logger.debug('Database client acquired', {
                processId: client.processID,
            });
        });
        this.pool.on('remove', (client) => {
            logger_1.logger.debug('Database client removed', {
                processId: client.processID,
            });
        });
        this.pool.on('error', (err) => {
            logger_1.logger.error('Database pool error:', {
                error: err.message,
                stack: err.stack,
            });
        });
    }
    getPool() {
        return this.pool;
    }
    async connect() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as version');
            logger_1.logger.info('Database connected successfully', {
                currentTime: result.rows[0]?.current_time,
                version: result.rows[0]?.version?.split(' ')[0],
                poolSize: this.pool.totalCount,
                database: this.getDatabaseName(),
            });
            client.release();
            this.isConnected = true;
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.pool.end();
            this.isConnected = false;
            logger_1.logger.info('Database disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Database disconnection failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    poolSize: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount,
                    responseTime,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                details: {
                    connected: false,
                    poolSize: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount,
                    responseTime: Date.now() - startTime,
                },
            };
        }
    }
    async runTransaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            logger_1.logger.debug('Transaction completed successfully');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Transaction failed, rolled back:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async query(text, params, client) {
        const startTime = Date.now();
        const queryClient = client || this.pool;
        try {
            const result = await queryClient.query(text, params);
            const duration = Date.now() - startTime;
            logger_1.logger.debug('Database query executed', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                params: params ? params.length : 0,
                rows: result.rowCount,
                duration,
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error('Database query failed:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                params: params ? params.length : 0,
                duration,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async migrate() {
        try {
            logger_1.logger.info('Starting database migration...');
            const migrationTableExists = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        );
      `);
            if (!migrationTableExists.rows[0].exists) {
                await this.query(`
          CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
                logger_1.logger.info('Migration table created');
            }
            const fs = require('fs');
            const path = require('path');
            const migrationsDir = path.join(__dirname, '../../migrations');
            if (fs.existsSync(migrationsDir)) {
                const migrationFiles = fs.readdirSync(migrationsDir)
                    .filter((file) => file.endsWith('.sql'))
                    .sort();
                for (const file of migrationFiles) {
                    const executed = await this.query('SELECT id FROM migrations WHERE filename = $1', [file]);
                    if (executed.rows.length === 0) {
                        logger_1.logger.info(`Running migration: ${file}`);
                        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                        await this.runTransaction(async (client) => {
                            await client.query(migrationSql);
                            await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
                        });
                        logger_1.logger.info(`Migration completed: ${file}`);
                    }
                }
            }
            logger_1.logger.info('Database migration completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Database migration failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    getDatabaseName() {
        try {
            const url = new URL(environment_config_1.config.database.url);
            return url.pathname.substring(1);
        }
        catch {
            return 'unknown';
        }
    }
    isHealthy() {
        return this.isConnected && this.pool.totalCount > 0;
    }
    getConnectionInfo() {
        return {
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount,
            isConnected: this.isConnected,
        };
    }
}
exports.DatabaseConfig = DatabaseConfig;
//# sourceMappingURL=database.config.js.map