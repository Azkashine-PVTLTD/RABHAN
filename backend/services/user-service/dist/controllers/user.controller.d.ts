import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    private userService;
    constructor();
    createProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createRegistrationProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    checkBNPLEligibility: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserDocuments: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateDocumentStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    searchUsers: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateCurrentUserProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUserBNPLEligibility: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUserDocuments: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=user.controller.d.ts.map