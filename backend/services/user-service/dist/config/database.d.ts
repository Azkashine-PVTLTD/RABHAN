import { Pool } from 'pg';
export declare class DatabaseConfig {
    private static instance;
    private pool;
    private readonly config;
    private constructor();
    static getInstance(): DatabaseConfig;
    connect(): Promise<Pool>;
    disconnect(): Promise<void>;
    getPool(): Pool;
    getPoolStats(): Promise<{
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    } | null>;
}
export declare const db: DatabaseConfig;
//# sourceMappingURL=database.d.ts.map