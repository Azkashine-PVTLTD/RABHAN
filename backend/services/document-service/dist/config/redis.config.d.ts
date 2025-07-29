import Redis from 'ioredis';
export declare class RedisConfig {
    private static instance;
    private client;
    private isConnected;
    private constructor();
    static getInstance(): RedisConfig;
    private setupEventHandlers;
    getClient(): Redis;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            connected: boolean;
            responseTime: number;
            memory?: any;
            stats?: any;
        };
    }>;
    createUploadSession(sessionId: string, userId: string, metadata: any): Promise<void>;
    getUploadSession(sessionId: string): Promise<any | null>;
    updateUploadSession(sessionId: string, updates: any): Promise<void>;
    deleteUploadSession(sessionId: string): Promise<void>;
    cacheValidationResult(fileHash: string, validationResult: any): Promise<void>;
    getValidationResult(fileHash: string): Promise<any | null>;
    checkRateLimit(userId: string, maxRequests?: number, windowMs?: number): Promise<{
        allowed: boolean;
        remainingRequests: number;
        resetTime: number;
    }>;
    enqueueDocument(documentId: string, processingType: string, priority?: 'low' | 'medium' | 'high'): Promise<void>;
    dequeueDocument(processingType: string): Promise<{
        documentId: string;
        priority: string;
        enqueuedAt: string;
    } | null>;
    cacheAuditEvent(eventId: string, eventData: any, ttl?: number): Promise<void>;
    getAuditEvent(eventId: string): Promise<any | null>;
    acquireLock(lockKey: string, ttl?: number): Promise<boolean>;
    releaseLock(lockKey: string): Promise<void>;
    private getPriorityScore;
    private parseRedisInfo;
    isHealthy(): boolean;
}
//# sourceMappingURL=redis.config.d.ts.map