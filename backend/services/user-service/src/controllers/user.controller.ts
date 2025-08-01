import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse, CreateUserProfileDTO, UpdateUserProfileDTO } from '../types';
import { logger } from '../utils/logger';
import { StatusCodes } from 'http-status-codes';
import { ResponseUtils } from '../../../../shared/utils/response.utils';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateUserProfileDTO = req.body;
      const authToken = req.headers.authorization?.replace('Bearer ', '') || '';

      const profile = await this.userService.createProfile(data, authToken);
      const response = ResponseUtils.created(profile, 'Profile created successfully', req.id);
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  };

  createRegistrationProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateUserProfileDTO = req.body;

      const profile = await this.userService.createRegistrationProfile(data);

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        message: 'Registration profile created successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Access denied'
        });
      }

      const profile = await this.userService.getProfile(userId);

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const data: UpdateUserProfileDTO = req.body;
      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Access denied'
        });
      }

      const profile = await this.userService.updateProfile(
        userId,
        data,
        req.ip,
        req.headers['user-agent']
      );

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        message: 'Profile updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Check BNPL eligibility
  checkBNPLEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      // Ensure user can only check their own eligibility unless admin
      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Access denied'
        });
      }

      const eligibility = await this.userService.checkBNPLEligibility(userId);

      const response: ApiResponse<typeof eligibility> = {
        success: true,
        data: eligibility,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get user documents
  getUserDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      // Ensure user can only access their own documents unless admin
      if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Access denied'
        });
      }

      const documents = await this.userService.getUserDocuments(userId);

      const response: ApiResponse<typeof documents> = {
        success: true,
        data: documents,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update document status (Admin only)
  updateDocumentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, documentType } = req.params;
      const { status, rejectionReason } = req.body;

      // Admin only endpoint
      if (req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const document = await this.userService.updateDocumentStatus(
        userId,
        documentType,
        status,
        rejectionReason,
        req.user.id
      );

      const response: ApiResponse<typeof document> = {
        success: true,
        data: document,
        message: `Document ${status} successfully`,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Search users (Admin only)
  searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admin only endpoint
      if (req.user?.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const result = await this.userService.searchUsers(req.query, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Current user endpoints (/me)
  getCurrentUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const profile = await this.userService.getProfile(userId);

      // If no profile exists, return an empty profile structure
      const profileData = profile || {
        id: '',
        userId: userId,
        firstName: '',
        lastName: '',
        region: '',
        city: '',
        district: '',
        streetAddress: '',
        postalCode: '',
        propertyType: '',
        propertyOwnership: '',
        roofSize: 0,
        gpsLatitude: 0,
        gpsLongitude: 0,
        electricityConsumption: '',
        electricityMeterNumber: '',
        preferredLanguage: 'ar',
        emailNotifications: true,
        smsNotifications: true,
        marketingConsent: false,
        profileCompleted: false,
        profileCompletionPercentage: 0
      };

      const response: ApiResponse<typeof profileData> = {
        success: true,
        data: profileData,
        message: profile ? 'Current user profile retrieved successfully' : 'No profile found, returning empty profile',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateCurrentUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🎯 updateCurrentUserProfile controller called');
      console.log('👤 req.user:', req.user);
      console.log('📝 req.body:', req.body);
      
      const userId = req.user?.id;
      const data: UpdateUserProfileDTO = req.body;

      if (!userId) {
        console.log('❌ No userId found');
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      console.log('✅ User authenticated, proceeding with update for userId:', userId);

      const profile = await this.userService.updateProfile(
        userId,
        data,
        req.ip,
        req.headers['user-agent']
      );

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
        message: 'Current user profile updated successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUserBNPLEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const eligibility = await this.userService.checkBNPLEligibility(userId);

      const response: ApiResponse<typeof eligibility> = {
        success: true,
        data: eligibility,
        message: 'BNPL eligibility checked successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUserDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const documents = await this.userService.getUserDocuments(userId);

      const response: ApiResponse<typeof documents> = {
        success: true,
        data: documents,
        message: 'User documents retrieved successfully',
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.SERVICE_VERSION || '1.0.0',
          requestId: req.id
        }
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
}