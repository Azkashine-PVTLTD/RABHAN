import winston from 'winston';
export declare const logger: winston.Logger;
export declare const auditLogger: winston.Logger;
export declare const performanceLogger: winston.Logger;
export declare const logInfo: (message: string, metadata?: any) => void;
export declare const logError: (message: string, error?: any, metadata?: any) => void;
export declare const logWarn: (message: string, metadata?: any) => void;
export declare const logDebug: (message: string, metadata?: any) => void;
export declare const logAudit: (eventType: string, eventData: any, userId?: string) => void;
export declare const logPerformance: (operation: string, duration: number, metadata?: any) => void;
//# sourceMappingURL=logger.d.ts.map