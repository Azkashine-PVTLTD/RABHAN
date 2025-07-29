import winston from 'winston';
export declare const logger: winston.Logger;
export declare class SAMALogger {
    static logAuthEvent(eventType: string, userId?: string, data?: any): void;
    static logSecurityEvent(eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', data?: any): void;
    static logComplianceViolation(violation: string, userId?: string, data?: any): void;
}
//# sourceMappingURL=logger.d.ts.map