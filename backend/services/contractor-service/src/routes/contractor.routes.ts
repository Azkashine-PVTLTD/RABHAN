import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ContractorController } from '../controllers/contractor.controller';
import { 
  authenticateToken, 
  optionalAuth, 
  requireAdmin, 
  requireContractorOwnership,
  logAccess,
  AuthenticatedRequest
} from '../middleware/auth.middleware';
import { BusinessType, ServiceCategory, ContractorStatus } from '../types/contractor.types';

const router = Router();
const contractorController = new ContractorController();

// Apply access logging to all routes
router.use(logAccess);

/**
 * POST /api/contractors/register
 * Register a new contractor
 * Requires authentication
 */
router.post('/register',
  authenticateToken,
  [
    // Business information validation
    body('business_name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Business name must be between 2 and 255 characters'),
    
    body('business_name_ar')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Arabic business name must be between 2 and 255 characters'),
    
    body('business_type')
      .isIn(Object.values(BusinessType))
      .withMessage('Invalid business type'),
    
    body('commercial_registration')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('Commercial registration must be between 5 and 50 characters'),
    
    body('vat_number')
      .optional()
      .trim()
      .matches(/^[0-9]{15}$/)
      .withMessage('VAT number must be 15 digits'),
    
    // Contact information validation
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('phone')
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('Phone must be valid Saudi number (+966xxxxxxxxx)'),
    
    body('whatsapp')
      .optional()
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('WhatsApp must be valid Saudi number (+966xxxxxxxxx)'),
    
    body('website')
      .optional()
      .isURL()
      .withMessage('Valid website URL required'),
    
    // Address validation
    body('address_line1')
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Address line 1 must be between 5 and 255 characters'),
    
    body('address_line2')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 2 must not exceed 255 characters'),
    
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    
    body('region')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Region must be between 2 and 100 characters'),
    
    body('postal_code')
      .optional()
      .matches(/^[0-9]{5}$/)
      .withMessage('Postal code must be 5 digits'),
    
    // Business details validation
    body('established_year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Established year must be valid'),
    
    body('employee_count')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Employee count must be between 1 and 10000'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    
    body('description_ar')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Arabic description must not exceed 2000 characters'),
    
    // Service information validation
    body('service_categories')
      .isArray({ min: 1, max: 5 })
      .withMessage('At least 1 and maximum 5 service categories required'),
    
    body('service_categories.*')
      .isIn(Object.values(ServiceCategory))
      .withMessage('Invalid service category'),
    
    body('service_areas')
      .isArray({ min: 1, max: 10 })
      .withMessage('At least 1 and maximum 10 service areas required'),
    
    body('service_areas.*')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Service area must be between 2 and 100 characters'),
    
    body('years_experience')
      .isInt({ min: 0, max: 50 })
      .withMessage('Years of experience must be between 0 and 50')
  ],
  contractorController.registerContractor
);

/**
 * GET /api/contractors/profile
 * Get current user's contractor profile
 * Requires authentication
 */
router.get('/profile',
  authenticateToken,
  requireContractorOwnership,
  contractorController.getContractorProfile
);

/**
 * PUT /api/contractors/profile
 * Update contractor profile
 * Requires authentication
 */
router.put('/profile',
  authenticateToken,
  requireContractorOwnership,
  [
    // Business information validation
    body('business_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Business name must be between 2 and 255 characters'),
    
    body('commercial_registration')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('Commercial registration must be between 5 and 50 characters'),
    
    body('vat_number')
      .optional()
      .trim()
      .matches(/^[0-9]{15}$/)
      .withMessage('VAT number must be 15 digits'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('phone')
      .optional()
      .matches(/^\+966[0-9]{9}$/)
      .withMessage('Phone must be valid Saudi number (+966xxxxxxxxx)'),
  ],
  contractorController.updateContractorProfile
);

/**
 * GET /api/contractors/dashboard/stats
 * Get contractor dashboard statistics
 * Requires authentication
 */
router.get('/dashboard/stats',
  authenticateToken,
  requireContractorOwnership,
  contractorController.getDashboardStats
);

/**
 * GET /api/contractors/search
 * Search contractors with filters
 * Optional authentication for better results
 */
router.get('/search',
  optionalAuth,
  [
    query('region')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Region must be between 2 and 100 characters'),
    
    query('city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    
    query('service_categories')
      .optional()
      .custom((value) => {
        const categories = value.split(',');
        return categories.every((cat: string) => Object.values(ServiceCategory).includes(cat as ServiceCategory));
      })
      .withMessage('Invalid service categories'),
    
    query('status')
      .optional()
      .isIn(Object.values(ContractorStatus))
      .withMessage('Invalid contractor status'),
    
    query('min_rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),
    
    query('max_distance_km')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Maximum distance must be between 1 and 1000 km'),
    
    query('verification_level')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Verification level must be between 0 and 5'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort_by')
      .optional()
      .isIn(['created_at', 'updated_at', 'business_name', 'average_rating', 'total_reviews', 'verification_level', 'years_experience'])
      .withMessage('Invalid sort field'),
    
    query('sort_order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  contractorController.searchContractors
);

/**
 * GET /api/contractors/health
 * Health check endpoint
 * No authentication required
 */
router.get('/health',
  contractorController.healthCheck
);

/**
 * GET /api/contractors/:id
 * Get contractor by ID
 * Optional authentication
 */
router.get('/:id',
  optionalAuth,
  [
    param('id')
      .isUUID()
      .withMessage('Valid contractor ID required')
  ],
  contractorController.getContractorById
);

/**
 * PUT /api/contractors/:id/status
 * Update contractor status (Admin only)
 * Requires admin authentication
 */
router.put('/:id/status',
  authenticateToken,
  requireAdmin,
  [
    param('id')
      .isUUID()
      .withMessage('Valid contractor ID required'),
    
    body('status')
      .isIn(Object.values(ContractorStatus))
      .withMessage('Valid status is required'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
  ],
  contractorController.updateContractorStatus
);

export default router;