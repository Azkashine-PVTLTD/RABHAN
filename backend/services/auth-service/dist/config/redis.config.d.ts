import Redis from 'ioredis';
export declare class RedisConfig {
    private static instance;
    private client;
    private constructor();
    static getInstance(): RedisConfig;
    getClient(): Redis;
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=redis.config.d.ts.map