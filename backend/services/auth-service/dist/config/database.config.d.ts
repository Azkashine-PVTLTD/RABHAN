import { Pool } from 'pg';
export declare class DatabaseConfig {
    private static instance;
    private pool;
    private readonly poolConfig;
    private constructor();
    static getInstance(): DatabaseConfig;
    getPool(): Pool;
    private setupPoolEventHandlers;
    testConnection(): Promise<boolean>;
    closePool(): Promise<void>;
}
//# sourceMappingURL=database.config.d.ts.map