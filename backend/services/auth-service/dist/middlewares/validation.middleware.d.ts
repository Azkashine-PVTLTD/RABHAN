import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
export declare const validate: (schema: Schema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Schema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Schema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map