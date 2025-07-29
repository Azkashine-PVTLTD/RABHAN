import winston from 'winston';
export declare const logger: winston.Logger;
export declare const auditLogger: {
    contractorRegistration: (contractorId: string, userId: string, metadata: any) => void;
    verification: (contractorId: string, verificationType: string, status: string, adminId: string) => void;
    documentUpload: (contractorId: string, documentType: string, documentId: string) => void;
    statusChange: (contractorId: string, oldStatus: string, newStatus: string, changedBy: string) => void;
    dataAccess: (contractorId: string, accessedBy: string, accessType: string) => void;
    securityEvent: (event: string, severity: string, metadata: any) => void;
};
export declare const performanceLogger: {
    slowOperation: (operation: string, duration: number, metadata?: any) => void;
    apiResponse: (endpoint: string, method: string, statusCode: number, duration: number) => void;
    databaseQuery: (query: string, duration: number, rows?: number) => void;
};
export declare const logError: (error: Error, context?: any) => void;
export declare const logRequest: (req: any, res: any, startTime: number) => void;
export default logger;
