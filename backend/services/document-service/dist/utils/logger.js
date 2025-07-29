"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMALogger = exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
exports.logApiRequest = logApiRequest;
exports.logDatabaseQuery = logDatabaseQuery;
const winston_1 = __importDefault(require("winston"));
const environment_config_1 = require("../config/environment.config");
const samaLogLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
    sama: 7,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey',
    sama: 'brightMagenta',
};
winston_1.default.addColors(logColors);
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label'],
}));
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, metadata }) => {
    let log = `${timestamp} [${level}] ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
        log += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    return log;
}));
const jsonFormat = winston_1.default.format.combine(logFormat, winston_1.default.format.json());
const transports = [];
if (environment_config_1.config.isDevelopment || environment_config_1.config.logging.enableConsole) {
    transports.push(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: environment_config_1.config.logging.level,
    }));
}
if (environment_config_1.config.isProduction) {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/document-service.log',
        format: jsonFormat,
        level: environment_config_1.config.logging.level,
        maxsize: parseInt(environment_config_1.config.logging.maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: environment_config_1.config.logging.maxFiles,
    }));
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/document-service-error.log',
        format: jsonFormat,
        level: 'error',
        maxsize: parseInt(environment_config_1.config.logging.maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: environment_config_1.config.logging.maxFiles,
    }));
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/sama-compliance.log',
        format: jsonFormat,
        level: 'sama',
        maxsize: parseInt(environment_config_1.config.logging.maxSize.replace('m', '')) * 1024 * 1024,
        maxFiles: environment_config_1.config.logging.maxFiles,
    }));
}
exports.logger = winston_1.default.createLogger({
    levels: samaLogLevels,
    level: environment_config_1.config.logging.level,
    format: environment_config_1.config.logging.format === 'json' ? jsonFormat : logFormat,
    transports,
    exitOnError: false,
    defaultMeta: {
        service: environment_config_1.config.server.serviceName,
        environment: environment_config_1.config.env,
        timestamp: new Date().toISOString(),
    },
});
class SAMALogger {
    static auditQueue = [];
    static isProcessing = false;
    static logDocumentEvent(eventType, documentId, userId, metadata = {}) {
        const auditEvent = {
            id: this.generateEventId(),
            eventType,
            category: 'DOCUMENT_MANAGEMENT',
            severity: this.getSeverityLevel(eventType),
            timestamp: new Date().toISOString(),
            documentId,
            userId,
            eventData: {
                ...metadata,
                complianceFramework: 'SAMA_CSF',
                controlReference: this.mapEventToSAMAControl(eventType),
                auditTrail: true,
            },
            samaControlReference: this.mapEventToSAMAControl(eventType),
            complianceStatus: 'compliant',
            retentionPeriod: 7 * 365,
            correlationId: this.generateCorrelationId(),
            sessionId: metadata.sessionId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
        };
        exports.logger.log('sama', 'SAMA Document Event', auditEvent);
        this.auditQueue.push(auditEvent);
        this.processAuditQueue();
    }
    static logSecurityEvent(eventType, severity, metadata = {}) {
        const securityEvent = {
            id: this.generateEventId(),
            eventType,
            category: 'SECURITY',
            severity,
            timestamp: new Date().toISOString(),
            eventData: {
                ...metadata,
                securityFramework: 'SAMA_CSF_SECURITY',
                immediateAction: severity === 'CRITICAL' || severity === 'HIGH',
            },
            samaControlReference: this.mapSecurityEventToSAMAControl(eventType),
            complianceStatus: 'violation',
            notificationRequired: severity === 'CRITICAL' || severity === 'HIGH',
            correlationId: this.generateCorrelationId(),
            timestamp: new Date().toISOString(),
        };
        exports.logger.log('sama', 'SAMA Security Event', securityEvent);
        if (severity === 'CRITICAL') {
            this.sendImmediateNotification(securityEvent);
        }
        this.auditQueue.push(securityEvent);
        this.processAuditQueue();
    }
    static logComplianceEvent(eventType, controlReference, metadata = {}) {
        const complianceEvent = {
            id: this.generateEventId(),
            eventType,
            category: 'COMPLIANCE',
            severity: 'MEDIUM',
            timestamp: new Date().toISOString(),
            eventData: {
                ...metadata,
                complianceFramework: 'SAMA_CSF',
                controlReference,
                auditTrail: true,
            },
            samaControlReference: controlReference,
            complianceStatus: 'compliant',
            retentionPeriod: 7 * 365,
            correlationId: this.generateCorrelationId(),
            timestamp: new Date().toISOString(),
        };
        exports.logger.log('sama', 'SAMA Compliance Event', complianceEvent);
        this.auditQueue.push(complianceEvent);
        this.processAuditQueue();
    }
    static logAccessEvent(eventType, userId, resourceId, metadata = {}) {
        const accessEvent = {
            id: this.generateEventId(),
            eventType,
            category: 'ACCESS_CONTROL',
            severity: eventType === 'ACCESS_DENIED' ? 'MEDIUM' : 'LOW',
            timestamp: new Date().toISOString(),
            userId,
            resourceId,
            eventData: {
                ...metadata,
                accessControlFramework: 'SAMA_CSF_ACCESS',
                rbacEnabled: true,
            },
            samaControlReference: 'CSF-3.3.5-ACCESS',
            complianceStatus: eventType === 'ACCESS_DENIED' ? 'violation' : 'compliant',
            correlationId: this.generateCorrelationId(),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            timestamp: new Date().toISOString(),
        };
        exports.logger.log('sama', 'SAMA Access Event', accessEvent);
        this.auditQueue.push(accessEvent);
        this.processAuditQueue();
    }
    static async processAuditQueue() {
        if (this.isProcessing || this.auditQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            const batchSize = 10;
            const batch = this.auditQueue.splice(0, batchSize);
            for (const event of batch) {
                await this.processAuditEvent(event);
            }
            if (this.auditQueue.length > 0) {
                setTimeout(() => {
                    this.isProcessing = false;
                    this.processAuditQueue();
                }, 100);
            }
            else {
                this.isProcessing = false;
            }
        }
        catch (error) {
            exports.logger.error('SAMA audit queue processing failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                queueLength: this.auditQueue.length,
            });
            this.isProcessing = false;
        }
    }
    static async processAuditEvent(event) {
        try {
            if (event.notificationRequired) {
                await this.sendSAMANotification(event);
            }
            if (environment_config_1.config.sama.reportingEndpoint) {
                await this.exportToSAMASystem(event);
            }
        }
        catch (error) {
            exports.logger.error('SAMA audit event processing failed:', {
                eventId: event.id,
                eventType: event.eventType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    static async sendSAMANotification(event) {
        try {
            exports.logger.warn('SAMA notification required:', {
                eventId: event.id,
                eventType: event.eventType,
                severity: event.severity,
                timestamp: event.timestamp,
            });
            if (environment_config_1.config.sama.notificationEndpoint) {
            }
        }
        catch (error) {
            exports.logger.error('SAMA notification failed:', {
                eventId: event.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    static async sendImmediateNotification(event) {
        try {
            exports.logger.error('CRITICAL SAMA SECURITY EVENT:', {
                eventId: event.id,
                eventType: event.eventType,
                severity: event.severity,
                timestamp: event.timestamp,
                requiresImmediateAttention: true,
            });
            await this.sendSAMANotification(event);
        }
        catch (error) {
            exports.logger.error('Critical SAMA notification failed:', {
                eventId: event.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    static async exportToSAMASystem(event) {
        try {
            exports.logger.debug('Exporting to SAMA system:', {
                eventId: event.id,
                eventType: event.eventType,
            });
        }
        catch (error) {
            exports.logger.error('SAMA system export failed:', {
                eventId: event.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    static generateEventId() {
        return `sama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static getSeverityLevel(eventType) {
        const severityMap = {
            'DOCUMENT_UPLOAD': 'LOW',
            'DOCUMENT_DOWNLOAD': 'LOW',
            'DOCUMENT_DELETE': 'MEDIUM',
            'DOCUMENT_APPROVE': 'MEDIUM',
            'DOCUMENT_REJECT': 'MEDIUM',
            'VIRUS_DETECTED': 'CRITICAL',
            'INVALID_FILE_TYPE': 'MEDIUM',
            'UNAUTHORIZED_ACCESS': 'HIGH',
            'RATE_LIMIT_EXCEEDED': 'MEDIUM',
            'ENCRYPTION_FAILURE': 'HIGH',
        };
        return severityMap[eventType] || 'MEDIUM';
    }
    static mapEventToSAMAControl(eventType) {
        const controlMap = {
            'DOCUMENT_UPLOAD': 'CSF-3.3.3-ASSET-MANAGEMENT',
            'DOCUMENT_DOWNLOAD': 'CSF-3.3.3-ASSET-MANAGEMENT',
            'DOCUMENT_DELETE': 'CSF-3.3.3-ASSET-MANAGEMENT',
            'DOCUMENT_APPROVE': 'CSF-3.3.5-ACCESS-CONTROL',
            'DOCUMENT_REJECT': 'CSF-3.3.5-ACCESS-CONTROL',
        };
        return controlMap[eventType] || 'CSF-3.3.1-GENERAL';
    }
    static mapSecurityEventToSAMAControl(eventType) {
        const controlMap = {
            'VIRUS_DETECTED': 'CSF-3.3.7-MALWARE-PROTECTION',
            'INVALID_FILE_TYPE': 'CSF-3.3.6-APPLICATION-SECURITY',
            'UNAUTHORIZED_ACCESS': 'CSF-3.3.5-ACCESS-CONTROL',
            'RATE_LIMIT_EXCEEDED': 'CSF-3.3.6-APPLICATION-SECURITY',
            'ENCRYPTION_FAILURE': 'CSF-3.3.9-CRYPTOGRAPHY',
        };
        return controlMap[eventType] || 'CSF-3.3.1-GENERAL';
    }
}
exports.SAMALogger = SAMALogger;
function createRequestLogger(requestId, userId) {
    return exports.logger.child({
        requestId,
        userId,
        timestamp: new Date().toISOString(),
    });
}
function logApiRequest(method, url, statusCode, responseTime, requestId, userId) {
    exports.logger.http('API Request', {
        method,
        url,
        statusCode,
        responseTime,
        requestId,
        userId,
        timestamp: new Date().toISOString(),
    });
}
function logDatabaseQuery(query, parameters, duration, rowCount, requestId) {
    exports.logger.debug('Database Query', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        parametersCount: parameters.length,
        duration,
        rowCount,
        requestId,
        timestamp: new Date().toISOString(),
    });
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map