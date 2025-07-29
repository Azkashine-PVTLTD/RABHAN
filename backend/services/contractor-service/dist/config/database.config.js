"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = exports.getPoolStats = exports.closeDatabasePool = exports.checkDatabaseHealth = exports.pool = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
// SAMA-compliant database configuration with enhanced security
const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'rabhan_contractors',
    user: process.env.DATABASE_USER || 'contractor_service',
    password: process.env.DATABASE_PASSWORD,
    // Performance optimization for Saudi scale
    max: 20, // Maximum connections
    min: 5, // Minimum connections
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
    connectionTimeoutMillis: 10000, // 10 second connection timeout
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        ca: process.env.DATABASE_CA_CERT,
        cert: process.env.DATABASE_CLIENT_CERT,
        key: process.env.DATABASE_CLIENT_KEY
    } : false,
    // Connection validation
    application_name: 'rabhan_contractor_service',
    statement_timeout: 30000, // 30 second query timeout
    query_timeout: 30000, // 30 second query timeout
    // Additional performance settings
    options: process.env.NODE_ENV === 'production'
        ? '-c default_transaction_isolation=read_committed -c timezone=Asia/Riyadh'
        : undefined
};
// Create connection pool
exports.pool = new pg_1.Pool(dbConfig);
// Enhanced error handling with SAMA compliance logging
exports.pool.on('error', (err) => {
    logger_1.logger.error('Database pool error', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        service: 'contractor-service',
        compliance_event: 'database_error',
        impact_level: 'high'
    });
});
exports.pool.on('connect', (client) => {
    logger_1.logger.info('New database client connected', {
        timestamp: new Date().toISOString(),
        service: 'contractor-service'
    });
});
exports.pool.on('acquire', (client) => {
    logger_1.logger.debug('Client acquired from pool', {
        timestamp: new Date().toISOString(),
        pool_size: exports.pool.totalCount,
        idle_count: exports.pool.idleCount,
        waiting_count: exports.pool.waitingCount
    });
});
exports.pool.on('release', (client) => {
    logger_1.logger.debug('Client released to pool', {
        timestamp: new Date().toISOString(),
        pool_size: exports.pool.totalCount,
        idle_count: exports.pool.idleCount
    });
});
// Health check function
const checkDatabaseHealth = async () => {
    try {
        const client = await exports.pool.connect();
        try {
            const result = await client.query('SELECT NOW() as current_time, version() as db_version');
            logger_1.logger.info('Database health check passed', {
                timestamp: new Date().toISOString(),
                db_time: result.rows[0].current_time,
                db_version: result.rows[0].db_version.split(' ')[0]
            });
            return true;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        logger_1.logger.error('Database health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            service: 'contractor-service'
        });
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
// Graceful shutdown
const closeDatabasePool = async () => {
    try {
        await exports.pool.end();
        logger_1.logger.info('Database pool closed successfully', {
            timestamp: new Date().toISOString(),
            service: 'contractor-service'
        });
    }
    catch (error) {
        logger_1.logger.error('Error closing database pool', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            service: 'contractor-service'
        });
    }
};
exports.closeDatabasePool = closeDatabasePool;
// Performance monitoring
const getPoolStats = () => {
    return {
        totalCount: exports.pool.totalCount,
        idleCount: exports.pool.idleCount,
        waitingCount: exports.pool.waitingCount,
        timestamp: new Date().toISOString()
    };
};
exports.getPoolStats = getPoolStats;
// Database query execution with monitoring
const executeQuery = async (query, params = [], operation = 'unknown') => {
    const startTime = Date.now();
    const client = await exports.pool.connect();
    try {
        const result = await client.query(query, params);
        const duration = Date.now() - startTime;
        // Log slow queries (SAMA performance monitoring)
        if (duration > 1000) {
            logger_1.logger.warn('Slow query detected', {
                operation,
                duration,
                query: query.substring(0, 100) + '...',
                timestamp: new Date().toISOString(),
                service: 'contractor-service'
            });
        }
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('Database query error', {
            operation,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
            query: query.substring(0, 100) + '...',
            timestamp: new Date().toISOString(),
            service: 'contractor-service'
        });
        throw error;
    }
    finally {
        client.release();
    }
};
exports.executeQuery = executeQuery;
exports.default = exports.pool;
//# sourceMappingURL=database.config.js.map