import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        phone: string;
        role: string;
        isAdmin: boolean;
        isVerified: boolean;
        permissions: string[];
    };
    requestId?: string;
}
/**
 * JWT Authentication middleware
 * Validates JWT tokens and extracts user information
 */
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware
 * Extracts user information if token is present, but doesn't require it
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role
 */
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Permission-based authorization middleware
 * Requires user to have specific permissions
 */
export declare const requirePermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Rate limiting based on user
 * Different limits for authenticated vs anonymous users
 */
export declare const userBasedRateLimit: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Contractor ownership middleware
 * Ensures user can only access their own contractor data
 */
export declare const requireContractorOwnership: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * SAMA compliance logging middleware
 * Logs all access attempts for audit purposes
 */
export declare const logAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
