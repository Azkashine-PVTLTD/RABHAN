import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
export declare const uploadMiddleware: multer.Multer;
export declare const handleUploadError: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const validateUploadRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const uploadRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=upload.middleware.d.ts.map