import { Pool } from 'pg';
export declare const pool: Pool;
export declare const checkDatabaseHealth: () => Promise<boolean>;
export declare const closeDatabasePool: () => Promise<void>;
export declare const getPoolStats: () => {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    timestamp: string;
};
export declare const executeQuery: (query: string, params?: any[], operation?: string) => Promise<import("pg").QueryResult<any>>;
export default pool;
