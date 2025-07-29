import { User, RegisterRequest, LoginRequest, AuthTokens } from '../types/auth.types';
export declare class AuthService {
    private pool;
    private redis;
    constructor();
    register(data: RegisterRequest): Promise<AuthTokens>;
    login(data: LoginRequest): Promise<AuthTokens>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    logout(userId: string, sessionId: string): Promise<void>;
    getUserById(userId: string): Promise<User | null>;
    updateUserProfile(userId: string, updateData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
    }): Promise<void>;
    private incrementLoginAttempts;
    private resetLoginAttempts;
    private cacheUserData;
    private getCachedUserData;
    private clearUserCache;
    private maskPhoneNumber;
    lookupUserByEmail(email: string): Promise<{
        phone: string;
        maskedPhone: string;
    } | null>;
    sendLoginOTPByEmail(email: string): Promise<{
        maskedPhone: string;
    } | null>;
    verifyLoginOTP(email: string, otp: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=auth.service.d.ts.map