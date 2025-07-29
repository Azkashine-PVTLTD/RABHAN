"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const cache_service_1 = require("../services/cache.service");
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const cacheService = new cache_service_1.CacheService();
const authService = new auth_service_1.AuthService();
// Basic health check
router.get('/health', async (req, res) => {
    try {
        const health = {
            service: 'user-service',
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            status: 'healthy'
        };
        res.status(200).json(health);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', error);
        res.status(503).json({
            service: 'user-service',
            status: 'unhealthy',
            error: 'Service health check failed'
        });
    }
});
// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
    const startTime = Date.now();
    try {
        const checks = await Promise.allSettled([
            checkDatabase(),
            checkCache(),
            checkAuthService()
        ]);
        const [databaseCheck, cacheCheck, authCheck] = checks;
        const health = {
            service: 'user-service',
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: Date.now() - startTime,
            status: 'healthy',
            checks: {
                database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'unhealthy', error: databaseCheck.reason },
                cache: cacheCheck.status === 'fulfilled' ? cacheCheck.value : { status: 'unhealthy', error: cacheCheck.reason },
                authService: authCheck.status === 'fulfilled' ? authCheck.value : { status: 'unhealthy', error: authCheck.reason }
            }
        };
        // Determine overall status
        const hasUnhealthyDependency = Object.values(health.checks).some(check => check.status === 'unhealthy');
        if (hasUnhealthyDependency) {
            health.status = 'degraded';
        }
        const statusCode = health.status === 'healthy' ? 200 :
            health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed', error);
        res.status(503).json({
            service: 'user-service',
            status: 'unhealthy',
            error: 'Service health check failed',
            responseTime: Date.now() - startTime
        });
    }
});
// Ready check (for Kubernetes)
router.get('/ready', async (req, res) => {
    try {
        // Check if service is ready to receive traffic
        const databaseConnected = await checkDatabase();
        if (databaseConnected.status === 'healthy') {
            res.status(200).json({
                service: 'user-service',
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(503).json({
                service: 'user-service',
                status: 'not ready',
                reason: 'Database not connected'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Ready check failed', error);
        res.status(503).json({
            service: 'user-service',
            status: 'not ready',
            error: 'Service not ready'
        });
    }
});
// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
    res.status(200).json({
        service: 'user-service',
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});
// Metrics endpoint
router.get('/metrics', async (req, res) => {
    try {
        const poolStats = await database_1.db.getPoolStats();
        const metrics = {
            service: 'user-service',
            timestamp: new Date().toISOString(),
            database: {
                pool: poolStats
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
                external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
            },
            cpu: {
                uptime: process.uptime(),
                load: process.cpuUsage()
            }
        };
        res.status(200).json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Metrics collection failed', error);
        res.status(503).json({
            service: 'user-service',
            error: 'Metrics collection failed'
        });
    }
});
// Helper functions
async function checkDatabase() {
    const startTime = Date.now();
    try {
        const pool = database_1.db.getPool();
        await pool.query('SELECT 1');
        return {
            status: 'healthy',
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}
async function checkCache() {
    const startTime = Date.now();
    try {
        const isHealthy = await cacheService.isHealthy();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}
async function checkAuthService() {
    const startTime = Date.now();
    try {
        const isHealthy = await authService.isHealthy();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}
exports.default = router;
//# sourceMappingURL=health.routes.js.map