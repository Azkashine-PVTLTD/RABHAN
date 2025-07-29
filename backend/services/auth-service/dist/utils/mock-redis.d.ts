export declare function createMockRedis(): {
    get: (key: string) => Promise<string | null>;
    setex: (key: string, ttl: number, value: string) => Promise<void>;
    del: (key: string) => Promise<void>;
};
//# sourceMappingURL=mock-redis.d.ts.map