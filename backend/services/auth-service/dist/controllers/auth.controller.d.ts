import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
export declare class AuthController {
    private authService;
    private phoneVerificationService;
    private emailVerificationService;
    constructor();
    register: (req: Request, res: Response) => Promise<void>;
    contractorRegister: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    refreshToken: (req: Request, res: Response) => Promise<void>;
    logout: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    checkPasswordStrength: (req: Request, res: Response) => Promise<void>;
    requestPasswordReset: (req: Request, res: Response) => Promise<void>;
    resetPassword: (req: Request, res: Response) => Promise<void>;
    changePassword: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    sendPhoneOTP: (req: Request, res: Response) => Promise<void>;
    verifyPhoneOTP: (req: Request, res: Response) => Promise<void>;
    sendEmailVerification: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    verifyEmailToken: (req: Request, res: Response) => Promise<void>;
    sendEmailOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    verifyEmailOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    sendTestOTP: (req: Request, res: Response) => Promise<void>;
    verifyTestOTP: (req: Request, res: Response) => Promise<void>;
    getSupportedCountries: (_req: Request, res: Response) => Promise<void>;
    validatePhoneNumber: (req: Request, res: Response) => Promise<void>;
    lookupEmailForLogin: (req: Request, res: Response) => Promise<void>;
    sendLoginOTPToPhone: (req: Request, res: Response) => Promise<void>;
    verifyLoginOTP: (req: Request, res: Response) => Promise<void>;
    healthCheck: (_req: Request, res: Response) => Promise<void>;
    getDummyOTPInfo: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map