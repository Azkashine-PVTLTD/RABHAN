import { Pool, PoolClient } from 'pg';
export declare class DatabaseConfig {
    private static instance;
    private pool;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConfig;
    private setupEventHandlers;
    getPool(): Pool;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            connected: boolean;
            poolSize: number;
            idleCount: number;
            waitingCount: number;
            responseTime: number;
        };
    }>;
    runTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    query(text: string, params?: any[], client?: PoolClient): Promise<any>;
    migrate(): Promise<void>;
    private getDatabaseName;
    isHealthy(): boolean;
    getConnectionInfo(): {
        totalConnections: number;
        idleConnections: number;
        waitingClients: number;
        isConnected: boolean;
    };
}
//# sourceMappingURL=database.config.d.ts.map