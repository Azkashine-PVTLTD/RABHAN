"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const contractor_controller_1 = require("../controllers/contractor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const contractor_types_1 = require("../types/contractor.types");
const router = (0, express_1.Router)();
const contractorController = new contractor_controller_1.ContractorController();
// Apply access logging to all routes
router.use(auth_middleware_1.logAccess);
/**
 * POST /api/contractors/register
 * Register a new contractor
 * Requires authentication
 */
router.post('/register', auth_middleware_1.authenticateToken, [
    // Business information validation
    (0, express_validator_1.body)('business_name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Business name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('business_name_ar')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Arabic business name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('business_type')
        .isIn(Object.values(contractor_types_1.BusinessType))
        .withMessage('Invalid business type'),
    (0, express_validator_1.body)('commercial_registration')
        .optional()
        .trim()
        .isLength({ min: 5, max: 50 })
        .withMessage('Commercial registration must be between 5 and 50 characters'),
    (0, express_validator_1.body)('vat_number')
        .optional()
        .trim()
        .matches(/^[0-9]{15}$/)
        .withMessage('VAT number must be 15 digits'),
    // Contact information validation
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone')
        .matches(/^\+966[0-9]{9}$/)
        .withMessage('Phone must be valid Saudi number (+966xxxxxxxxx)'),
    (0, express_validator_1.body)('whatsapp')
        .optional()
        .matches(/^\+966[0-9]{9}$/)
        .withMessage('WhatsApp must be valid Saudi number (+966xxxxxxxxx)'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Valid website URL required'),
    // Address validation
    (0, express_validator_1.body)('address_line1')
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Address line 1 must be between 5 and 255 characters'),
    (0, express_validator_1.body)('address_line2')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Address line 2 must not exceed 255 characters'),
    (0, express_validator_1.body)('city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('region')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Region must be between 2 and 100 characters'),
    (0, express_validator_1.body)('postal_code')
        .optional()
        .matches(/^[0-9]{5}$/)
        .withMessage('Postal code must be 5 digits'),
    // Business details validation
    (0, express_validator_1.body)('established_year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage('Established year must be valid'),
    (0, express_validator_1.body)('employee_count')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Employee count must be between 1 and 10000'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    (0, express_validator_1.body)('description_ar')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Arabic description must not exceed 2000 characters'),
    // Service information validation
    (0, express_validator_1.body)('service_categories')
        .isArray({ min: 1, max: 5 })
        .withMessage('At least 1 and maximum 5 service categories required'),
    (0, express_validator_1.body)('service_categories.*')
        .isIn(Object.values(contractor_types_1.ServiceCategory))
        .withMessage('Invalid service category'),
    (0, express_validator_1.body)('service_areas')
        .isArray({ min: 1, max: 10 })
        .withMessage('At least 1 and maximum 10 service areas required'),
    (0, express_validator_1.body)('service_areas.*')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Service area must be between 2 and 100 characters'),
    (0, express_validator_1.body)('years_experience')
        .isInt({ min: 0, max: 50 })
        .withMessage('Years of experience must be between 0 and 50')
], contractorController.registerContractor);
/**
 * GET /api/contractors/profile
 * Get current user's contractor profile
 * Requires authentication
 */
router.get('/profile', auth_middleware_1.authenticateToken, auth_middleware_1.requireContractorOwnership, contractorController.getContractorProfile);
/**
 * PUT /api/contractors/profile
 * Update contractor profile
 * Requires authentication
 */
router.put('/profile', auth_middleware_1.authenticateToken, auth_middleware_1.requireContractorOwnership, [
    // Business information validation
    (0, express_validator_1.body)('business_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Business name must be between 2 and 255 characters'),
    (0, express_validator_1.body)('commercial_registration')
        .optional()
        .trim()
        .isLength({ min: 5, max: 50 })
        .withMessage('Commercial registration must be between 5 and 50 characters'),
    (0, express_validator_1.body)('vat_number')
        .optional()
        .trim()
        .matches(/^[0-9]{15}$/)
        .withMessage('VAT number must be 15 digits'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone')
        .optional()
        .matches(/^\+966[0-9]{9}$/)
        .withMessage('Phone must be valid Saudi number (+966xxxxxxxxx)'),
], contractorController.updateContractorProfile);
/**
 * GET /api/contractors/dashboard/stats
 * Get contractor dashboard statistics
 * Requires authentication
 */
router.get('/dashboard/stats', auth_middleware_1.authenticateToken, auth_middleware_1.requireContractorOwnership, contractorController.getDashboardStats);
/**
 * GET /api/contractors/search
 * Search contractors with filters
 * Optional authentication for better results
 */
router.get('/search', auth_middleware_1.optionalAuth, [
    (0, express_validator_1.query)('region')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Region must be between 2 and 100 characters'),
    (0, express_validator_1.query)('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.query)('service_categories')
        .optional()
        .custom((value) => {
        const categories = value.split(',');
        return categories.every((cat) => Object.values(contractor_types_1.ServiceCategory).includes(cat));
    })
        .withMessage('Invalid service categories'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(contractor_types_1.ContractorStatus))
        .withMessage('Invalid contractor status'),
    (0, express_validator_1.query)('min_rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Minimum rating must be between 0 and 5'),
    (0, express_validator_1.query)('max_distance_km')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Maximum distance must be between 1 and 1000 km'),
    (0, express_validator_1.query)('verification_level')
        .optional()
        .isInt({ min: 0, max: 5 })
        .withMessage('Verification level must be between 0 and 5'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort_by')
        .optional()
        .isIn(['created_at', 'updated_at', 'business_name', 'average_rating', 'total_reviews', 'verification_level', 'years_experience'])
        .withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
], contractorController.searchContractors);
/**
 * GET /api/contractors/health
 * Health check endpoint
 * No authentication required
 */
router.get('/health', contractorController.healthCheck);
/**
 * GET /api/contractors/:id
 * Get contractor by ID
 * Optional authentication
 */
router.get('/:id', auth_middleware_1.optionalAuth, [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Valid contractor ID required')
], contractorController.getContractorById);
/**
 * PUT /api/contractors/:id/status
 * Update contractor status (Admin only)
 * Requires admin authentication
 */
router.put('/:id/status', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Valid contractor ID required'),
    (0, express_validator_1.body)('status')
        .isIn(Object.values(contractor_types_1.ContractorStatus))
        .withMessage('Valid status is required'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters')
], contractorController.updateContractorStatus);
exports.default = router;
//# sourceMappingURL=contractor.routes.js.map