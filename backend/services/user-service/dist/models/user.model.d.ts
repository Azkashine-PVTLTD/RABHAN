import { UserProfile, CreateUserProfileDTO, UpdateUserProfileDTO, UserDocument, BNPLEligibility } from '../types';
export declare class UserModel {
    private pool;
    constructor();
    createProfile(data: CreateUserProfileDTO): Promise<UserProfile>;
    getProfileByUserId(userId: string): Promise<UserProfile | null>;
    updateProfile(userId: string, data: UpdateUserProfileDTO): Promise<UserProfile>;
    updateProfileCompletion(userId: string): Promise<number>;
    checkBNPLEligibility(userId: string): Promise<BNPLEligibility>;
    getUserDocuments(userId: string): Promise<UserDocument[]>;
    updateDocumentStatus(userId: string, documentType: string, status: string, rejectionReason?: string): Promise<UserDocument>;
    logActivity(userId: string, activityType: string, activityData?: any, ipAddress?: string, userAgent?: string): Promise<void>;
    private mapRowToProfile;
    private mapRowToDocument;
    private camelToSnake;
}
//# sourceMappingURL=user.model.d.ts.map