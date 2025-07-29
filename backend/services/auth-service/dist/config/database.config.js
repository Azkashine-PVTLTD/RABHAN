"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const pg_1 = require("pg");
const environment_config_1 = require("./environment.config");
class DatabaseConfig {
    static instance;
    pool;
    poolConfig = {
        connectionString: environment_config_1.config.database.url,
        min: environment_config_1.config.database.poolMin,
        max: environment_config_1.config.database.poolMax,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        statement_timeout: 2000,
        query_timeout: 2000,
        application_name: 'rabhan-auth-service',
        ssl: environment_config_1.config.isProduction ? { rejectUnauthorized: false } : false
    };
    constructor() {
        this.pool = new pg_1.Pool(this.poolConfig);
        this.setupPoolEventHandlers();
    }
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    getPool() {
        return this.pool;
    }
    setupPoolEventHandlers() {
        this.pool.on('error', (err) => {
            console.error('Unexpected database error:', err);
        });
        this.pool.on('connect', (client) => {
            client.query('SET statement_timeout = 2000');
            client.query('SET lock_timeout = 1000');
            client.query('SET idle_in_transaction_session_timeout = 60000');
            client.query('SET work_mem = "64MB"');
        });
    }
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT NOW()');
            console.log('Database connection successful:', result.rows[0]);
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
    async closePool() {
        await this.pool.end();
    }
}
exports.DatabaseConfig = DatabaseConfig;
//# sourceMappingURL=database.config.js.map