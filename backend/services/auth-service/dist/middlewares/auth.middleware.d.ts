import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth.types';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        sessionId: string;
    };
}
export declare class AuthMiddleware {
    private authService;
    constructor();
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    authorize: (roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    optional: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=auth.middleware.d.ts.map