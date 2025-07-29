import { UserProfile, BNPLEligibility } from '../types';
export declare class CacheService {
    private redis;
    private readonly prefix;
    private readonly defaultTTL;
    constructor();
    getUserProfile(userId: string): Promise<UserProfile | null>;
    setUserProfile(userId: string, profile: UserProfile, ttl?: number): Promise<void>;
    invalidateUserProfile(userId: string): Promise<void>;
    getBNPLEligibility(userId: string): Promise<BNPLEligibility | null>;
    setBNPLEligibility(userId: string, eligibility: BNPLEligibility, ttl?: number): Promise<void>;
    invalidateBNPLEligibility(userId: string): Promise<void>;
    invalidateUserData(userId: string): Promise<void>;
    isHealthy(): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=cache.service.d.ts.map