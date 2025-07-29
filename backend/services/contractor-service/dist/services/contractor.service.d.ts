import { ContractorProfile, ContractorRegistrationData, ContractorSearchQuery, ContractorSearchResult, ContractorStatus, ContractorDashboardStats } from '../types/contractor.types';
export declare class ContractorService {
    /**
     * Register a new contractor
     * SAMA Compliant with audit logging
     */
    registerContractor(userId: string, contractorData: ContractorRegistrationData, requestMetadata: {
        ip_address?: string;
        user_agent?: string;
    }): Promise<ContractorProfile>;
    /**
     * Get contractor by ID
     */
    getContractorById(contractorId: string): Promise<ContractorProfile | null>;
    /**
     * Get contractor by user ID
     */
    getContractorByUserId(userId: string): Promise<ContractorProfile | null>;
    /**
     * Search contractors with filters
     */
    searchContractors(searchQuery: ContractorSearchQuery): Promise<ContractorSearchResult>;
    /**
     * Update contractor status (Admin function)
     */
    updateContractorStatus(contractorId: string, newStatus: ContractorStatus, adminId: string, notes?: string): Promise<ContractorProfile>;
    /**
     * Get contractor dashboard statistics
     */
    getContractorDashboardStats(contractorId: string): Promise<ContractorDashboardStats>;
    /**
     * Create audit log entry
     */
    private createAuditLog;
    /**
     * Update contractor profile
     * SAMA Compliant with audit logging
     */
    updateContractorProfile(userId: string, updateData: Partial<ContractorProfile>, requestMetadata: {
        ip_address?: string;
        user_agent?: string;
    }): Promise<ContractorProfile>;
    /**
     * Map database row to ContractorProfile
     */
    private mapDatabaseRowToContractor;
    /**
     * Validate service categories
     */
    private validateServiceCategories;
    /**
     * Validate sort column for search
     */
    private validateSortColumn;
    /**
     * Calculate profile completion percentage
     */
    private calculateProfileCompletion;
}
