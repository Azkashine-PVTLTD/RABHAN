interface AuthUser {
    id: string;
    email: string;
    phone?: string;
    nationalId?: string;
    role: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    samaVerified: boolean;
}
export declare class AuthService {
    private client;
    constructor();
    verifyUser(userId: string, authToken: string): Promise<AuthUser | null>;
    validateToken(token: string): Promise<any>;
    getUserByNationalId(nationalId: string, adminToken: string): Promise<AuthUser | null>;
    isHealthy(): Promise<boolean>;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map