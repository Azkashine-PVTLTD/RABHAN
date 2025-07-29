import { Request, Response, NextFunction } from 'express';
export declare const createRateLimiter: (windowMs: number, max: number, message: string) => import("express-rate-limit").RateLimitRequestHandler;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipWhitelist: (allowedIPs: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const samaCompliance: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    optionsSuccessStatus: number;
};
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.middleware.d.ts.map