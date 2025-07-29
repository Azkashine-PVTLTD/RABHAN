export declare enum KYCStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    PENDING_REVIEW = "pending_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    REQUIRES_REVISION = "requires_revision"
}
export declare enum UserRole {
    USER = "customer",
    CONTRACTOR = "contractor"
}
export interface KYCRequirement {
    categoryId: string;
    categoryName: string;
    required: boolean;
    uploaded: boolean;
    approved: boolean;
    documentId?: string;
}
export interface KYCWorkflowStatus {
    userId: string;
    userRole: UserRole;
    status: KYCStatus;
    completionPercentage: number;
    requirements: KYCRequirement[];
    lastUpdated: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
}
export declare class KYCWorkflowService {
    private static instance;
    private database;
    private static readonly USER_KYC_REQUIREMENTS;
    private static readonly CONTRACTOR_KYC_REQUIREMENTS;
    private constructor();
    static getInstance(): KYCWorkflowService;
    getKYCStatus(userId: string, userRole: UserRole): Promise<KYCWorkflowStatus>;
    submitForReview(userId: string, userRole: UserRole): Promise<boolean>;
    approveKYC(userId: string, userRole: UserRole, approvedBy: string, notes?: string): Promise<boolean>;
    rejectKYC(userId: string, userRole: UserRole, rejectedBy: string, reason: string): Promise<boolean>;
    getPendingReviews(userRole?: UserRole): Promise<any[]>;
    private getRequiredCategories;
    private getUserDocuments;
    private updateDocumentsStatus;
    getHealthStatus(): {
        status: 'healthy' | 'unhealthy';
        details: {
            databaseConnection: boolean;
            kycRequirements: {
                user: number;
                contractor: number;
            };
        };
    };
}
//# sourceMappingURL=kyc-workflow.service.d.ts.map