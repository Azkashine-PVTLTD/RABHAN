import { Request, Response } from 'express';
export declare class KYCController {
    private kycService;
    constructor();
    getKYCStatus: (req: Request, res: Response) => Promise<void>;
    submitKYCForReview: (req: Request, res: Response) => Promise<void>;
    getKYCRequirements: (req: Request, res: Response) => Promise<void>;
    getPendingReviews: (req: Request, res: Response) => Promise<void>;
    approveKYC: (req: Request, res: Response) => Promise<void>;
    rejectKYC: (req: Request, res: Response) => Promise<void>;
    getHealthStatus: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=kyc.controller.d.ts.map