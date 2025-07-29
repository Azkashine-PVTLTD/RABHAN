"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformance = exports.logAudit = exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.performanceLogger = exports.auditLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const os_1 = require("os");
// SAMA compliant logging configuration
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(logColors);
// Custom format for structured logging
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }), winston_1.default.format.json());
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, metadata }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
    }
    return log;
}));
// Daily rotate file transport for production logs
const fileRotateTransport = new winston_daily_rotate_file_1.default({
    filename: 'logs/user-service-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '30d', // Keep logs for 30 days
    format: logFormat,
    auditFile: 'logs/.audit/user-service-audit.json'
});
// Error log file transport
const errorFileTransport = new winston_daily_rotate_file_1.default({
    filename: 'logs/user-service-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '90d', // Keep error logs for 90 days
    level: 'error',
    format: logFormat,
    auditFile: 'logs/.audit/user-service-error-audit.json'
});
// SAMA compliance audit log transport
const auditFileTransport = new winston_daily_rotate_file_1.default({
    filename: 'logs/sama-audit-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '2555d', // 7 years retention for SAMA compliance
    format: logFormat,
    auditFile: 'logs/.audit/sama-audit.json'
});
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    format: logFormat,
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'user-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        hostname: (0, os_1.hostname)()
    },
    transports: [
        fileRotateTransport,
        errorFileTransport
    ],
    exitOnError: false
});
// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
// SAMA compliance audit logger
exports.auditLogger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'user-service',
        compliance: 'SAMA',
        framework: 'CSF'
    },
    transports: [auditFileTransport]
});
// Performance logger for monitoring
exports.performanceLogger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'user-service',
        type: 'performance'
    },
    transports: [
        new winston_daily_rotate_file_1.default({
            filename: 'logs/performance-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '100m',
            maxFiles: '7d',
            format: logFormat
        })
    ]
});
// Helper functions for structured logging
const logInfo = (message, metadata) => {
    exports.logger.info(message, metadata);
};
exports.logInfo = logInfo;
const logError = (message, error, metadata) => {
    exports.logger.error(message, { error: error?.stack || error, ...metadata });
};
exports.logError = logError;
const logWarn = (message, metadata) => {
    exports.logger.warn(message, metadata);
};
exports.logWarn = logWarn;
const logDebug = (message, metadata) => {
    exports.logger.debug(message, metadata);
};
exports.logDebug = logDebug;
// SAMA compliance audit logging
const logAudit = (eventType, eventData, userId) => {
    exports.auditLogger.info('Audit Event', {
        eventType,
        eventData,
        userId,
        timestamp: new Date().toISOString(),
        correlationId: eventData.correlationId || 'N/A'
    });
};
exports.logAudit = logAudit;
// Performance metric logging
const logPerformance = (operation, duration, metadata) => {
    exports.performanceLogger.info('Performance Metric', {
        operation,
        duration,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};
exports.logPerformance = logPerformance;
//# sourceMappingURL=logger.js.map