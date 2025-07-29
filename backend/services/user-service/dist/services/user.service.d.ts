import { UserProfile, CreateUserProfileDTO, UpdateUserProfileDTO, BNPLEligibility, UserDocument } from '../types';
export declare class UserService {
    private userModel;
    private cacheService;
    private authService;
    constructor();
    createProfile(data: CreateUserProfileDTO, authToken: string): Promise<UserProfile>;
    createRegistrationProfile(data: CreateUserProfileDTO): Promise<UserProfile>;
    getProfile(userId: string): Promise<UserProfile | null>;
    updateProfile(userId: string, data: UpdateUserProfileDTO, ipAddress?: string, userAgent?: string): Promise<UserProfile>;
    checkBNPLEligibility(userId: string): Promise<BNPLEligibility>;
    getUserDocuments(userId: string): Promise<UserDocument[]>;
    updateDocumentStatus(userId: string, documentType: string, status: 'verified' | 'rejected', rejectionReason?: string, verifiedBy?: string): Promise<UserDocument>;
    searchUsers(filters: any, pagination: any): Promise<any>;
    private validateSaudiData;
}
//# sourceMappingURL=user.service.d.ts.map