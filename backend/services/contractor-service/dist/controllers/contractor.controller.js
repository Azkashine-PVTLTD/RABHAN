"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractorController = void 0;
const contractor_service_1 = require("../services/contractor.service");
const contractor_types_1 = require("../types/contractor.types");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
class ContractorController {
    constructor() {
        /**
         * Register a new contractor
         * POST /api/contractors/register
         */
        this.registerContractor = async (req, res) => {
            const startTime = Date.now();
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid input data',
                            details: errors.array(),
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'User authentication required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const contractorData = req.body;
                const requestMetadata = {
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                };
                // Register contractor
                const contractor = await this.contractorService.registerContractor(userId, contractorData, requestMetadata);
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse('/api/contractors/register', 'POST', 201, duration);
                res.status(201).json({
                    success: true,
                    data: contractor,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to register contractor', {
                    user_id: req.user?.id,
                    error: errorMessage,
                    duration,
                    ip_address: req.ip
                });
                logger_1.performanceLogger.apiResponse('/api/contractors/register', 'POST', 500, duration);
                // Determine error status code
                let statusCode = 500;
                let errorCode = 'INTERNAL_ERROR';
                if (errorMessage.includes('already has a contractor profile')) {
                    statusCode = 409;
                    errorCode = 'CONTRACTOR_EXISTS';
                }
                else if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
                    statusCode = 400;
                    errorCode = 'VALIDATION_ERROR';
                }
                res.status(statusCode).json({
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Get contractor profile
         * GET /api/contractors/profile
         */
        this.getContractorProfile = async (req, res) => {
            const startTime = Date.now();
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'User authentication required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const contractor = await this.contractorService.getContractorByUserId(userId);
                if (!contractor) {
                    res.status(404).json({
                        success: false,
                        error: {
                            code: 'CONTRACTOR_NOT_FOUND',
                            message: 'Contractor profile not found',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                // Log data access for audit
                logger_1.auditLogger.dataAccess(contractor.id, userId, 'profile_view');
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse('/api/contractors/profile', 'GET', 200, duration);
                res.json({
                    success: true,
                    data: contractor,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to get contractor profile', {
                    user_id: req.user?.id,
                    error: errorMessage,
                    duration
                });
                logger_1.performanceLogger.apiResponse('/api/contractors/profile', 'GET', 500, duration);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Get contractor by ID (Admin or public view)
         * GET /api/contractors/:id
         */
        this.getContractorById = async (req, res) => {
            const startTime = Date.now();
            try {
                const contractorId = req.params.id;
                if (!contractorId) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_ID',
                            message: 'Contractor ID is required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const contractor = await this.contractorService.getContractorById(contractorId);
                if (!contractor) {
                    res.status(404).json({
                        success: false,
                        error: {
                            code: 'CONTRACTOR_NOT_FOUND',
                            message: 'Contractor not found',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                // Log data access for audit
                const accessedBy = req.user?.id || 'anonymous';
                logger_1.auditLogger.dataAccess(contractorId, accessedBy, 'profile_view_by_id');
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse(`/api/contractors/${contractorId}`, 'GET', 200, duration);
                res.json({
                    success: true,
                    data: contractor,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to get contractor by ID', {
                    contractor_id: req.params.id,
                    error: errorMessage,
                    duration
                });
                logger_1.performanceLogger.apiResponse(`/api/contractors/${req.params.id}`, 'GET', 500, duration);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Search contractors
         * GET /api/contractors/search
         */
        this.searchContractors = async (req, res) => {
            const startTime = Date.now();
            try {
                const searchQuery = {
                    region: req.query.region,
                    city: req.query.city,
                    service_categories: req.query.service_categories
                        ? req.query.service_categories.split(',')
                        : undefined,
                    status: req.query.status,
                    min_rating: req.query.min_rating ? parseFloat(req.query.min_rating) : undefined,
                    max_distance_km: req.query.max_distance_km ? parseInt(req.query.max_distance_km) : undefined,
                    verification_level: req.query.verification_level ? parseInt(req.query.verification_level) : undefined,
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 20,
                    sort_by: req.query.sort_by || 'created_at',
                    sort_order: req.query.sort_order || 'desc'
                };
                // Validate pagination limits
                if (searchQuery.limit > 100) {
                    searchQuery.limit = 100; // Max 100 items per page
                }
                const result = await this.contractorService.searchContractors(searchQuery);
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse('/api/contractors/search', 'GET', 200, duration);
                res.json({
                    success: true,
                    data: result,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to search contractors', {
                    search_query: req.query,
                    error: errorMessage,
                    duration
                });
                logger_1.performanceLogger.apiResponse('/api/contractors/search', 'GET', 500, duration);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Update contractor status (Admin only)
         * PUT /api/contractors/:id/status
         */
        this.updateContractorStatus = async (req, res) => {
            const startTime = Date.now();
            try {
                // Check admin permissions
                if (!req.user?.isAdmin) {
                    res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Admin access required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const contractorId = req.params.id;
                const { status, notes } = req.body;
                const adminId = req.user.id;
                if (!status || !Object.values(contractor_types_1.ContractorStatus).includes(status)) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_STATUS',
                            message: 'Valid status is required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const updatedContractor = await this.contractorService.updateContractorStatus(contractorId, status, adminId, notes);
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse(`/api/contractors/${contractorId}/status`, 'PUT', 200, duration);
                res.json({
                    success: true,
                    data: updatedContractor,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to update contractor status', {
                    contractor_id: req.params.id,
                    admin_id: req.user?.id,
                    error: errorMessage,
                    duration
                });
                logger_1.performanceLogger.apiResponse(`/api/contractors/${req.params.id}/status`, 'PUT', 500, duration);
                let statusCode = 500;
                let errorCode = 'INTERNAL_ERROR';
                if (errorMessage.includes('not found')) {
                    statusCode = 404;
                    errorCode = 'CONTRACTOR_NOT_FOUND';
                }
                res.status(statusCode).json({
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Get contractor dashboard statistics
         * GET /api/contractors/dashboard/stats
         */
        this.getDashboardStats = async (req, res) => {
            const startTime = Date.now();
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'User authentication required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                // Get contractor by user ID first
                const contractor = await this.contractorService.getContractorByUserId(userId);
                if (!contractor) {
                    res.status(404).json({
                        success: false,
                        error: {
                            code: 'CONTRACTOR_NOT_FOUND',
                            message: 'Contractor profile not found',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const stats = await this.contractorService.getContractorDashboardStats(contractor.id);
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse('/api/contractors/dashboard/stats', 'GET', 200, duration);
                res.json({
                    success: true,
                    data: stats,
                    metadata: {
                        timestamp: new Date(),
                        request_id: req.requestId,
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to get dashboard stats', {
                    user_id: req.user?.id,
                    error: errorMessage,
                    duration
                });
                logger_1.performanceLogger.apiResponse('/api/contractors/dashboard/stats', 'GET', 500, duration);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Update contractor profile
         * PUT /api/contractors/profile
         */
        this.updateContractorProfile = async (req, res) => {
            const startTime = Date.now();
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid input data',
                            details: errors.array(),
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'User authentication required',
                            timestamp: new Date()
                        }
                    });
                    return;
                }
                // Update contractor profile
                const updatedContractor = await this.contractorService.updateContractorProfile(userId, req.body, {
                    ip_address: req.ip,
                    user_agent: req.get('user-agent')
                });
                const duration = Date.now() - startTime;
                logger_1.performanceLogger.apiResponse('/api/contractors/profile', 'PUT', 200, duration);
                logger_1.logger.info('Contractor profile updated successfully', {
                    contractor_id: updatedContractor.id,
                    user_id: userId,
                    duration
                });
                res.json({
                    success: true,
                    data: updatedContractor,
                    message: 'Contractor profile updated successfully'
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error('Failed to update contractor profile', {
                    user_id: req.user?.id,
                    error: errorMessage,
                    duration,
                    ip_address: req.ip
                });
                logger_1.performanceLogger.apiResponse('/api/contractors/profile', 'PUT', 500, duration);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: errorMessage,
                        timestamp: new Date()
                    }
                });
            }
        };
        /**
         * Health check endpoint
         * GET /api/contractors/health
         */
        this.healthCheck = async (req, res) => {
            try {
                res.json({
                    success: true,
                    data: {
                        service: 'contractor-service',
                        status: 'healthy',
                        timestamp: new Date(),
                        version: '1.0.0'
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'HEALTH_CHECK_FAILED',
                        message: 'Service health check failed',
                        timestamp: new Date()
                    }
                });
            }
        };
        this.contractorService = new contractor_service_1.ContractorService();
    }
}
exports.ContractorController = ContractorController;
//# sourceMappingURL=contractor.controller.js.map