export interface ContractorProfile {
    id: string;
    user_id: string;
    business_name: string;
    business_name_ar?: string;
    business_type: BusinessType;
    commercial_registration?: string;
    vat_number?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    website?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    region: string;
    postal_code?: string;
    country: string;
    established_year?: number;
    employee_count?: number;
    description?: string;
    description_ar?: string;
    service_categories: ServiceCategory[];
    service_areas: string[];
    years_experience: number;
    status: ContractorStatus;
    verification_level: number;
    admin_verified_at?: Date;
    admin_verified_by?: string;
    total_projects: number;
    completed_projects: number;
    average_rating: number;
    total_reviews: number;
    response_time_hours?: number;
    bank_account_verified: boolean;
    tax_clearance_verified: boolean;
    financial_standing_verified: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    created_by?: string;
    updated_by?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface ContractorRegistrationData {
    business_name: string;
    business_name_ar?: string;
    business_type: BusinessType;
    commercial_registration?: string;
    vat_number?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    website?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    region: string;
    postal_code?: string;
    established_year?: number;
    employee_count?: number;
    description?: string;
    description_ar?: string;
    service_categories: ServiceCategory[];
    service_areas: string[];
    years_experience: number;
}
export interface ContractorCertification {
    id: string;
    contractor_id: string;
    certification_type: CertificationType;
    certification_name: string;
    certification_number?: string;
    issuing_authority: string;
    issue_date: Date;
    expiry_date?: Date;
    document_id?: string;
    document_url?: string;
    file_name?: string;
    file_size?: number;
    verification_status: VerificationStatus;
    verified_at?: Date;
    verified_by?: string;
    verification_notes?: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
    ip_address?: string;
}
export interface ContractorBusinessDocument {
    id: string;
    contractor_id: string;
    document_type: string;
    document_name: string;
    document_number?: string;
    document_id?: string;
    document_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    verification_status: VerificationStatus;
    verified_at?: Date;
    verified_by?: string;
    verification_notes?: string;
    expiry_date?: Date;
    renewal_reminder_sent: boolean;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
    ip_address?: string;
}
export interface ContractorServiceArea {
    id: string;
    contractor_id: string;
    region: string;
    city: string;
    districts: string[];
    service_categories: ServiceCategory[];
    travel_cost: number;
    service_radius_km?: number;
    is_active: boolean;
    priority_level: number;
    created_at: Date;
    updated_at: Date;
}
export interface ContractorReview {
    id: string;
    contractor_id: string;
    customer_id: string;
    project_id?: string;
    rating: number;
    title?: string;
    review_text?: string;
    quality_rating?: number;
    communication_rating?: number;
    timeliness_rating?: number;
    professionalism_rating?: number;
    verified_customer: boolean;
    admin_approved: boolean;
    contractor_response?: string;
    contractor_response_date?: Date;
    created_at: Date;
    updated_at: Date;
    ip_address?: string;
    user_agent?: string;
}
export interface ContractorAvailability {
    id: string;
    contractor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    timezone: string;
    break_start_time?: string;
    break_end_time?: string;
    created_at: Date;
    updated_at: Date;
}
export interface ContractorAuditLog {
    id: string;
    contractor_id?: string;
    event_type: string;
    event_description: string;
    event_data?: Record<string, any>;
    performed_by?: string;
    performed_by_type: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    compliance_notes?: string;
    risk_assessment?: string;
    regulatory_impact: boolean;
    created_at: Date;
}
export declare enum ContractorStatus {
    PENDING = "pending",
    DOCUMENTS_REQUIRED = "documents_required",
    VERIFICATION = "verification",
    VERIFIED = "verified",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    REJECTED = "rejected",
    INACTIVE = "inactive"
}
export declare enum BusinessType {
    INDIVIDUAL = "individual",
    LLC = "llc",
    CORPORATION = "corporation",
    PARTNERSHIP = "partnership",
    OTHER = "other"
}
export declare enum ServiceCategory {
    RESIDENTIAL_SOLAR = "residential_solar",
    COMMERCIAL_SOLAR = "commercial_solar",
    INDUSTRIAL_SOLAR = "industrial_solar",
    MAINTENANCE = "maintenance",
    CONSULTATION = "consultation",
    DESIGN = "design",
    ELECTRICAL = "electrical",
    ROOFING = "roofing",
    ALL = "all"
}
export declare enum CertificationType {
    ELECTRICAL_LICENSE = "electrical_license",
    SOLAR_CERTIFICATION = "solar_certification",
    BUSINESS_LICENSE = "business_license",
    VAT_CERTIFICATE = "vat_certificate",
    COMMERCIAL_REGISTRATION = "commercial_registration",
    INSURANCE_CERTIFICATE = "insurance_certificate",
    SAFETY_CERTIFICATION = "safety_certification",
    OTHER = "other"
}
export declare enum VerificationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired",
    REQUIRES_UPDATE = "requires_update"
}
export interface ContractorSearchQuery {
    region?: string;
    city?: string;
    service_categories?: ServiceCategory[];
    status?: ContractorStatus;
    min_rating?: number;
    max_distance_km?: number;
    verification_level?: number;
    page?: number;
    limit?: number;
    sort_by?: 'rating' | 'distance' | 'reviews' | 'created_at';
    sort_order?: 'asc' | 'desc';
}
export interface ContractorSearchResult {
    contractors: ContractorProfile[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
}
export interface ContractorStats {
    total_contractors: number;
    active_contractors: number;
    pending_verification: number;
    by_region: Record<string, number>;
    by_service_category: Record<string, number>;
    average_rating: number;
    total_reviews: number;
}
export interface VerificationRequest {
    contractor_id: string;
    verification_type: 'certification' | 'business_document' | 'profile';
    item_id: string;
    status: VerificationStatus;
    notes?: string;
    admin_id: string;
}
export interface ContractorDashboardStats {
    total_projects: number;
    completed_projects: number;
    pending_projects: number;
    average_rating: number;
    total_reviews: number;
    response_time_hours: number;
    monthly_earnings: number;
    profile_completion: number;
    verification_status: string;
}
export interface ContractorError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ContractorError;
    metadata?: {
        timestamp: Date;
        request_id: string;
        version: string;
    };
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
