import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class ContractorController {
    private contractorService;
    constructor();
    /**
     * Register a new contractor
     * POST /api/contractors/register
     */
    registerContractor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Get contractor profile
     * GET /api/contractors/profile
     */
    getContractorProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Get contractor by ID (Admin or public view)
     * GET /api/contractors/:id
     */
    getContractorById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Search contractors
     * GET /api/contractors/search
     */
    searchContractors: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Update contractor status (Admin only)
     * PUT /api/contractors/:id/status
     */
    updateContractorStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Get contractor dashboard statistics
     * GET /api/contractors/dashboard/stats
     */
    getDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Update contractor profile
     * PUT /api/contractors/profile
     */
    updateContractorProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    /**
     * Health check endpoint
     * GET /api/contractors/health
     */
    healthCheck: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}
