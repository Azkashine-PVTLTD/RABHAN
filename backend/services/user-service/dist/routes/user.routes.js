"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_validator_1 = require("../validators/user.validator");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const router = (0, express_1.Router)();
// Lazy initialization of controller to avoid circular dependency
let userController;
const getUserController = () => {
    if (!userController) {
        userController = new user_controller_1.UserController();
    }
    return userController;
};
// Apply general rate limiting to all routes
router.use(rate_limit_middleware_1.generalRateLimit);
// Public routes (no authentication required)
// Registration profile creation (no auth required during signup)
router.post('/profiles/register', rate_limit_middleware_1.createRateLimit, user_validator_1.validateCreateRegistrationProfile, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().createRegistrationProfile(req, res, next)));
// User routes (authentication required)
router.post('/profiles', auth_middleware_1.authenticate, rate_limit_middleware_1.createRateLimit, user_validator_1.validateCreateProfile, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().createProfile(req, res, next)));
// Current user endpoints (/me) - MUST come before /:userId routes
router.get('/profiles/me', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().getCurrentUserProfile(req, res, next)));
router.put('/profiles/me', auth_middleware_1.authenticate, rate_limit_middleware_1.updateRateLimit, user_validator_1.validateUpdateProfile, (0, error_middleware_1.asyncHandler)((req, res, next) => {
    console.log('🎯 Route handler reached - calling controller');
    return getUserController().updateCurrentUserProfile(req, res, next);
}));
router.get('/profiles/:userId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().getProfile(req, res, next)));
router.put('/profiles/:userId', auth_middleware_1.authenticate, rate_limit_middleware_1.updateRateLimit, user_validator_1.validateUpdateProfile, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().updateProfile(req, res, next)));
router.get('/profiles/me/bnpl-eligibility', auth_middleware_1.authenticate, rate_limit_middleware_1.bnplRateLimit, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().getCurrentUserBNPLEligibility(req, res, next)));
router.get('/profiles/me/documents', auth_middleware_1.authenticate, rate_limit_middleware_1.documentRateLimit, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().getCurrentUserDocuments(req, res, next)));
router.get('/profiles/:userId/bnpl-eligibility', auth_middleware_1.authenticate, rate_limit_middleware_1.bnplRateLimit, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().checkBNPLEligibility(req, res, next)));
router.get('/profiles/:userId/documents', auth_middleware_1.authenticate, rate_limit_middleware_1.documentRateLimit, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().getUserDocuments(req, res, next)));
// Admin routes (admin authentication required)
router.put('/profiles/:userId/documents/:documentType/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'SUPER_ADMIN']), rate_limit_middleware_1.adminRateLimit, user_validator_1.validateUpdateDocumentStatus, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().updateDocumentStatus(req, res, next)));
router.get('/profiles/search', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'SUPER_ADMIN']), rate_limit_middleware_1.adminRateLimit, user_validator_1.validateSearchParams, (0, error_middleware_1.asyncHandler)((req, res, next) => getUserController().searchUsers(req, res, next)));
exports.default = router;
//# sourceMappingURL=user.routes.js.map