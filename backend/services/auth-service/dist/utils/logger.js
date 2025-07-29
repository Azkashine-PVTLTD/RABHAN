"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMALogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const environment_config_1 = require("../config/environment.config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
}));
exports.logger = winston_1.default.createLogger({
    level: environment_config_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: environment_config_1.config.server.serviceName },
    transports: [
        new winston_1.default.transports.Console({
            format: environment_config_1.config.isDevelopment ? consoleFormat : logFormat
        })
    ]
});
if (environment_config_1.config.isProduction) {
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5
    }));
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5
    }));
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/sama-audit.log',
        level: 'info',
        maxsize: 5242880,
        maxFiles: 30,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
    }));
}
class SAMALogger {
    static logAuthEvent(eventType, userId, data) {
        exports.logger.info('SAMA_AUTH_EVENT', {
            eventType,
            userId,
            data,
            timestamp: new Date().toISOString(),
            compliance: 'SAMA_CSF_3.3.5'
        });
    }
    static logSecurityEvent(eventType, severity, data) {
        exports.logger.warn('SAMA_SECURITY_EVENT', {
            eventType,
            severity,
            data,
            timestamp: new Date().toISOString(),
            compliance: 'SAMA_CSF_3.3.14'
        });
    }
    static logComplianceViolation(violation, userId, data) {
        exports.logger.error('SAMA_COMPLIANCE_VIOLATION', {
            violation,
            userId,
            data,
            timestamp: new Date().toISOString(),
            compliance: 'SAMA_BNPL_RULES'
        });
    }
}
exports.SAMALogger = SAMALogger;
//# sourceMappingURL=logger.js.map