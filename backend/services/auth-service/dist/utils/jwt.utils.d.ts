import { JWTPayload, UserRole } from '../types/auth.types';
export declare class JWTUtils {
    static generateAccessToken(payload: JWTPayload): string;
    static generateRefreshToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string;
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): JWTPayload;
    static decodeToken(token: string): JWTPayload | null;
    static getExpiresInMs(expiresIn: string): number;
    static generateTokenPair(userId: string, email: string, role: UserRole, sessionId: string): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    static isTokenExpiringSoon(token: string, thresholdMs?: number): boolean;
}
//# sourceMappingURL=jwt.utils.d.ts.map