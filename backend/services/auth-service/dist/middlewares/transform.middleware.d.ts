import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to transform frontend camelCase data to backend snake_case format
 * This runs before validation to ensure the data matches expected schema
 */
export declare const transformFrontendToBackend: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=transform.middleware.d.ts.map