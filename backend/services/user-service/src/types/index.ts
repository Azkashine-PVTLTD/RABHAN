// User Service Types and Interfaces

// Enums matching database
export enum PropertyType {
  VILLA = 'VILLA',
  APARTMENT = 'APARTMENT',
  DUPLEX = 'DUPLEX',
  TOWNHOUSE = 'TOWNHOUSE',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  OTHER = 'OTHER'
}

export enum PropertyOwnership {
  OWNED = 'OWNED',
  RENTED = 'RENTED',
  LEASED = 'LEASED',
  FAMILY_OWNED = 'FAMILY_OWNED'
}

export enum ElectricityConsumptionRange {
  RANGE_0_200 = '0_200',
  RANGE_200_400 = '200_400',
  RANGE_400_600 = '400_600',
  RANGE_600_800 = '600_800',
  RANGE_800_1000 = '800_1000',
  RANGE_1000_1200 = '1000_1200',
  RANGE_1200_1500 = '1200_1500',
  RANGE_1500_PLUS = '1500_PLUS'
}

export enum PreferredLanguage {
  ENGLISH = 'en',
  ARABIC = 'ar'
}

export enum EmploymentStatus {
  GOVERNMENT = 'government',
  PRIVATE = 'private',
  SELF_EMPLOYED = 'selfEmployed',
  STUDENT = 'student',
  RETIRED = 'retired'
}

export enum DocumentType {
  NATIONAL_ID_FRONT = 'national_id_front',
  NATIONAL_ID_BACK = 'national_id_back',
  PROOF_OF_ADDRESS = 'proof_of_address',
  SALARY_CERTIFICATE = 'salary_certificate'
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  FAILED = 'failed'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// User Profile Interface
export interface UserProfile {
  id: string;
  userId: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  
  // Address Information
  region: string;
  city: string;
  district: string;
  streetAddress: string;
  landmark?: string;
  postalCode: string;
  
  // Property & Energy Information
  propertyType: PropertyType;
  propertyOwnership: PropertyOwnership;
  roofSize: number;
  gpsLatitude: number;
  gpsLongitude: number;
  electricityConsumption: ElectricityConsumptionRange;
  electricityMeterNumber: string;
  
  // Preferences
  preferredLanguage: PreferredLanguage;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingConsent: boolean;
  
  // Employment Information
  employmentStatus?: EmploymentStatus;
  employerName?: string;
  jobTitle?: string;
  monthlyIncome?: string;
  yearsEmployed?: string;
  
  // Profile Status
  profileCompleted: boolean;
  profileCompletionPercentage: number;
  
  // BNPL Eligibility
  bnplEligible: boolean;
  bnplMaxAmount: number;
  bnplRiskScore?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Create/Update DTOs
export interface CreateUserProfileDTO {
  userId: string;
  firstName: string;
  lastName: string;
  region: string;
  city: string;
  district: string;
  streetAddress: string;
  landmark?: string;
  postalCode: string;
  propertyType: PropertyType;
  propertyOwnership: PropertyOwnership;
  roofSize: number;
  gpsLatitude: number;
  gpsLongitude: number;
  electricityConsumption: ElectricityConsumptionRange;
  electricityMeterNumber: string;
  preferredLanguage?: PreferredLanguage;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingConsent?: boolean;
  // Employment Information (optional for create)
  employmentStatus?: EmploymentStatus;
  employerName?: string;
  jobTitle?: string;
  monthlyIncome?: string;
  yearsEmployed?: string;
}

export interface UpdateUserProfileDTO {
  firstName?: string;
  lastName?: string;
  region?: string;
  city?: string;
  district?: string;
  streetAddress?: string;
  landmark?: string;
  postalCode?: string;
  propertyType?: PropertyType;
  propertyOwnership?: PropertyOwnership;
  roofSize?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  electricityConsumption?: ElectricityConsumptionRange;
  electricityMeterNumber?: string;
  preferredLanguage?: PreferredLanguage;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingConsent?: boolean;
  // Employment Information
  employmentStatus?: EmploymentStatus;
  employerName?: string;
  jobTitle?: string;
  monthlyIncome?: string;
  yearsEmployed?: string;
}

// User Document Interface
export interface UserDocument {
  id: string;
  userId: string;
  documentType: DocumentType;
  uploadStatus: UploadStatus;
  verificationStatus: VerificationStatus;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// User Activity Interface
export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  activityData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// BNPL Eligibility Response
export interface BNPLEligibility {
  eligible: boolean;
  maxAmount: number;
  riskScore: number;
  reason: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchParams extends PaginationParams {
  region?: string;
  city?: string;
  propertyType?: PropertyType;
  bnplEligible?: boolean;
  profileCompleted?: boolean;
}

// Audit Log Interface
export interface AuditLog {
  id: string;
  userId?: string;
  eventType: string;
  eventData: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: string;
  timestamp: Date;
  complianceFramework?: string;
  complianceControl?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Error Types
export class UserServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class ValidationError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ComplianceError extends UserServiceError {
  constructor(message: string, details?: any) {
    super(message, 'COMPLIANCE_ERROR', 403, details);
    this.name = 'ComplianceError';
  }
}