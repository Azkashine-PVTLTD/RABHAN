import winston from 'winston';
export declare const logger: winston.Logger;
export declare class SAMALogger {
    private static auditQueue;
    private static isProcessing;
    static logDocumentEvent(eventType: 'DOCUMENT_UPLOAD' | 'DOCUMENT_DOWNLOAD' | 'DOCUMENT_DELETE' | 'DOCUMENT_APPROVE' | 'DOCUMENT_REJECT', documentId: string, userId: string, metadata?: any): void;
    static logSecurityEvent(eventType: 'VIRUS_DETECTED' | 'INVALID_FILE_TYPE' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'ENCRYPTION_FAILURE', severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', metadata?: any): void;
    static logComplianceEvent(eventType: 'DATA_RETENTION_POLICY' | 'ENCRYPTION_KEY_ROTATION' | 'ACCESS_CONTROL_UPDATE' | 'AUDIT_LOG_EXPORT', controlReference: string, metadata?: any): void;
    static logAccessEvent(eventType: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PERMISSION_ESCALATION' | 'ROLE_CHANGE', userId: string, resourceId: string, metadata?: any): void;
    private static processAuditQueue;
    private static processAuditEvent;
    private static sendSAMANotification;
    private static sendImmediateNotification;
    private static exportToSAMASystem;
    private static generateEventId;
    private static generateCorrelationId;
    private static getSeverityLevel;
    private static mapEventToSAMAControl;
    private static mapSecurityEventToSAMAControl;
}
export declare function createRequestLogger(requestId: string, userId?: string): winston.Logger;
export declare function logApiRequest(method: string, url: string, statusCode: number, responseTime: number, requestId: string, userId?: string): void;
export declare function logDatabaseQuery(query: string, parameters: any[], duration: number, rowCount: number, requestId?: string): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map