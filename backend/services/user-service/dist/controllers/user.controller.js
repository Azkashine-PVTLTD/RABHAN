"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const http_status_codes_1 = require("http-status-codes");
class UserController {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    // Create user profile
    createProfile = async (req, res, next) => {
        try {
            const data = req.body;
            const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
            const profile = await this.userService.createProfile(data, authToken);
            const response = {
                success: true,
                data: profile,
                message: 'Profile created successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.CREATED).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Create profile during registration (no auth required)
    createRegistrationProfile = async (req, res, next) => {
        try {
            const data = req.body;
            const profile = await this.userService.createRegistrationProfile(data);
            const response = {
                success: true,
                data: profile,
                message: 'Registration profile created successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.CREATED).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Get user profile
    getProfile = async (req, res, next) => {
        try {
            const { userId } = req.params;
            // Ensure user can only access their own profile unless admin
            if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            const profile = await this.userService.getProfile(userId);
            const response = {
                success: true,
                data: profile,
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Update user profile
    updateProfile = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const data = req.body;
            // Ensure user can only update their own profile unless admin
            if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            const profile = await this.userService.updateProfile(userId, data, req.ip, req.headers['user-agent']);
            const response = {
                success: true,
                data: profile,
                message: 'Profile updated successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Check BNPL eligibility
    checkBNPLEligibility = async (req, res, next) => {
        try {
            const { userId } = req.params;
            // Ensure user can only check their own eligibility unless admin
            if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            const eligibility = await this.userService.checkBNPLEligibility(userId);
            const response = {
                success: true,
                data: eligibility,
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Get user documents
    getUserDocuments = async (req, res, next) => {
        try {
            const { userId } = req.params;
            // Ensure user can only access their own documents unless admin
            if (req.user?.id !== userId && req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            const documents = await this.userService.getUserDocuments(userId);
            const response = {
                success: true,
                data: documents,
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Update document status (Admin only)
    updateDocumentStatus = async (req, res, next) => {
        try {
            const { userId, documentType } = req.params;
            const { status, rejectionReason } = req.body;
            // Admin only endpoint
            if (req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Admin access required'
                });
            }
            const document = await this.userService.updateDocumentStatus(userId, documentType, status, rejectionReason, req.user.id);
            const response = {
                success: true,
                data: document,
                message: `Document ${status} successfully`,
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    // Search users (Admin only)
    searchUsers = async (req, res, next) => {
        try {
            // Admin only endpoint
            if (req.user?.role !== 'ADMIN') {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    error: 'Admin access required'
                });
            }
            const result = await this.userService.searchUsers(req.query, {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                data: result.users,
                pagination: result.pagination,
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
    // Current user endpoints (/me)
    getCurrentUserProfile = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
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
            const response = {
                success: true,
                data: profileData,
                message: profile ? 'Current user profile retrieved successfully' : 'No profile found, returning empty profile',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    updateCurrentUserProfile = async (req, res, next) => {
        try {
            console.log('🎯 updateCurrentUserProfile controller called');
            console.log('👤 req.user:', req.user);
            console.log('📝 req.body:', req.body);
            const userId = req.user?.id;
            const data = req.body;
            if (!userId) {
                console.log('❌ No userId found');
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            console.log('✅ User authenticated, proceeding with update for userId:', userId);
            const profile = await this.userService.updateProfile(userId, data, req.ip, req.headers['user-agent']);
            const response = {
                success: true,
                data: profile,
                message: 'Current user profile updated successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getCurrentUserBNPLEligibility = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const eligibility = await this.userService.checkBNPLEligibility(userId);
            const response = {
                success: true,
                data: eligibility,
                message: 'BNPL eligibility checked successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    getCurrentUserDocuments = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }
            const documents = await this.userService.getUserDocuments(userId);
            const response = {
                success: true,
                data: documents,
                message: 'User documents retrieved successfully',
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: process.env.SERVICE_VERSION || '1.0.0',
                    requestId: req.id
                }
            };
            res.status(http_status_codes_1.StatusCodes.OK).json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map