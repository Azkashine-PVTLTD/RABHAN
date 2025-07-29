import { UserModel } from '../models/user.model';
import {
  UserProfile,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
  BNPLEligibility,
  UserDocument,
  NotFoundError,
  ValidationError,
  PropertyType,
  PropertyOwnership,
  ElectricityConsumptionRange,
  PreferredLanguage
} from '../types';
import { CacheService } from './cache.service';
import { AuthService } from './auth.service';
import { logger } from '../utils/logger';

export class UserService {
  private userModel: UserModel;
  private cacheService: CacheService;
  private authService: AuthService;

  constructor() {
    this.userModel = new UserModel();
    this.cacheService = new CacheService();
    this.authService = new AuthService();
  }

  async createProfile(data: CreateUserProfileDTO, authToken: string): Promise<UserProfile> {
    try {
      const authUser = await this.authService.verifyUser(data.userId, authToken);
      if (!authUser) {
        throw new ValidationError('Invalid user ID or authentication');
      }

      this.validateSaudiData(data);
      const profile = await this.userModel.createProfile(data);
      await this.cacheService.setUserProfile(profile.userId, profile);
      await this.userModel.logActivity(
        profile.userId,
        'PROFILE_CREATED',
        { profileId: profile.id }
      );

      logger.info('User profile created successfully', {
        userId: profile.userId,
        profileId: profile.id
      });

      return profile;
    } catch (error) {
      logger.error('Failed to create user profile', error);
      throw error;
    }
  }

  // Create user profile during registration (no auth verification)
  async createRegistrationProfile(data: CreateUserProfileDTO): Promise<UserProfile> {
    try {
      // Skip auth verification during registration
      
      // Validate Saudi-specific data
      this.validateSaudiData(data);

      // Create profile
      const profile = await this.userModel.createProfile(data);

      // Cache the profile
      await this.cacheService.setUserProfile(profile.userId, profile);

      // Log activity
      await this.userModel.logActivity(
        profile.userId,
        'PROFILE_CREATED',
        { profileId: profile.id }
      );

      logger.info('Registration profile created successfully', {
        userId: profile.userId,
        profileId: profile.id
      });

      return profile;
    } catch (error) {
      logger.error('Failed to create registration profile', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = await this.cacheService.getUserProfile(userId);
      if (cached) {
        return cached;
      }

      // Get from database
      const profile = await this.userModel.getProfileByUserId(userId);
      if (!profile) {
        // Return null instead of throwing error - profile doesn't exist yet
        logger.info('Profile not found for user, returning null', { userId });
        return null;
      }

      // Cache the profile
      await this.cacheService.setUserProfile(userId, profile);

      return profile;
    } catch (error) {
      logger.error('Failed to get user profile', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    data: UpdateUserProfileDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserProfile> {
    try {
      // Validate update data
      if (data.postalCode || data.city || data.region) {
        this.validateSaudiData(data as any);
      }

      // Check if profile exists
      const existingProfile = await this.userModel.getProfileByUserId(userId);
      
      let profile: UserProfile;
      
      if (!existingProfile) {
        // Profile doesn't exist, create it with the provided data
        logger.info('Profile not found, creating new profile for user', { userId });
        
        // Prepare create data with required fields
        const createData: CreateUserProfileDTO = {
          userId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          region: data.region || 'riyadh',  // Default to Riyadh
          city: data.city || 'Riyadh',
          district: data.district || 'Unknown',
          streetAddress: data.streetAddress || 'Unknown',
          postalCode: data.postalCode || '11111',  // Default Saudi postal code
          propertyType: data.propertyType || PropertyType.VILLA,
          propertyOwnership: data.propertyOwnership || PropertyOwnership.OWNED,
          roofSize: data.roofSize || 0,
          gpsLatitude: data.gpsLatitude || 0,
          gpsLongitude: data.gpsLongitude || 0,
          electricityConsumption: data.electricityConsumption || ElectricityConsumptionRange.RANGE_0_200,
          electricityMeterNumber: data.electricityMeterNumber || '',
          preferredLanguage: data.preferredLanguage || PreferredLanguage.ARABIC,
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? true,
          marketingConsent: data.marketingConsent ?? false,
          // Include employment fields if provided
          ...(data.employmentStatus && { employmentStatus: data.employmentStatus }),
          ...(data.employerName && { employerName: data.employerName }),
          ...(data.jobTitle && { jobTitle: data.jobTitle }),
          ...(data.monthlyIncome && { monthlyIncome: data.monthlyIncome }),
          ...(data.yearsEmployed && { yearsEmployed: data.yearsEmployed })
        };
        
        profile = await this.userModel.createProfile(createData);
        
        // Log activity
        await this.userModel.logActivity(
          userId,
          'PROFILE_CREATED_ON_UPDATE',
          { initialData: Object.keys(data) },
          ipAddress,
          userAgent
        );
      } else {
        // Profile exists, update it
        profile = await this.userModel.updateProfile(userId, data);
        
        // Log activity
        await this.userModel.logActivity(
          userId,
          'PROFILE_UPDATED',
          { changes: Object.keys(data) },
          ipAddress,
          userAgent
        );
      }

      // Invalidate cache
      await this.cacheService.invalidateUserProfile(userId);

      logger.info('User profile updated successfully', {
        userId: profile.userId,
        fieldsUpdated: Object.keys(data).length,
        created: !existingProfile
      });

      return profile;
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw error;
    }
  }

  // Check BNPL eligibility
  async checkBNPLEligibility(userId: string): Promise<BNPLEligibility> {
    try {
      // Check cache first
      const cached = await this.cacheService.getBNPLEligibility(userId);
      if (cached) {
        return cached;
      }

      // Ensure profile exists and is complete
      const profile = await this.getProfile(userId);
      if (!profile.profileCompleted) {
        return {
          eligible: false,
          maxAmount: 0,
          riskScore: 1,
          reason: 'Profile incomplete'
        };
      }

      // Check eligibility
      const eligibility = await this.userModel.checkBNPLEligibility(userId);

      // Cache the result for 1 hour
      await this.cacheService.setBNPLEligibility(userId, eligibility, 3600);

      // Log activity
      await this.userModel.logActivity(
        userId,
        'BNPL_ELIGIBILITY_CHECKED',
        {
          eligible: eligibility.eligible,
          maxAmount: eligibility.maxAmount
        }
      );

      return eligibility;
    } catch (error) {
      logger.error('Failed to check BNPL eligibility', error);
      throw error;
    }
  }

  // Get user documents
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      return await this.userModel.getUserDocuments(userId);
    } catch (error) {
      logger.error('Failed to get user documents', error);
      throw error;
    }
  }

  // Update document verification status
  async updateDocumentStatus(
    userId: string,
    documentType: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string,
    verifiedBy?: string
  ): Promise<UserDocument> {
    try {
      const document = await this.userModel.updateDocumentStatus(
        userId,
        documentType,
        status,
        rejectionReason
      );

      // Invalidate BNPL eligibility cache as document status affects it
      await this.cacheService.invalidateBNPLEligibility(userId);

      // Log activity
      await this.userModel.logActivity(
        userId,
        'DOCUMENT_STATUS_UPDATED',
        {
          documentType,
          status,
          verifiedBy,
          rejectionReason
        }
      );

      // Check if all required documents are verified
      const documents = await this.getUserDocuments(userId);
      const requiredDocs = ['national_id_front', 'national_id_back', 'proof_of_address'];
      const allVerified = requiredDocs.every(docType =>
        documents.some(doc => doc.documentType === docType && doc.verificationStatus === 'verified')
      );

      if (allVerified) {
        // Update profile completion
        await this.userModel.updateProfileCompletion(userId);
      }

      return document;
    } catch (error) {
      logger.error('Failed to update document status', error);
      throw error;
    }
  }

  // Search users (for admin)
  async searchUsers(filters: any, pagination: any): Promise<any> {
    try {
      // This would be implemented with proper search query
      // For now, returning placeholder
      return {
        users: [],
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      logger.error('Failed to search users', error);
      throw error;
    }
  }

  // Private methods
  private validateSaudiData(data: Partial<CreateUserProfileDTO>): void {
    // Validate postal code (5 digits)
    if (data.postalCode && !/^\d{5}$/.test(data.postalCode)) {
      throw new ValidationError('Invalid postal code. Must be 5 digits');
    }

    // Validate Saudi regions
    const saudiRegions = [
      'riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim',
      'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah'
    ];
    
    if (data.region && !saudiRegions.includes(data.region.toLowerCase())) {
      throw new ValidationError('Invalid Saudi region');
    }

    // GPS coordinates validation removed - allow worldwide coordinates

    // Validate meter number format
    if (data.electricityMeterNumber && !/^[A-Z0-9]{6,15}$/.test(data.electricityMeterNumber)) {
      throw new ValidationError('Invalid electricity meter number format');
    }
  }
}