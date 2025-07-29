"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const validation_utils_1 = require("../utils/validation.utils");
const security_middleware_1 = require("../middlewares/security.middleware");
const transform_middleware_1 = require("../middlewares/transform.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
const authMiddleware = new auth_middleware_1.AuthMiddleware();
// Health check endpoint
router.get('/health', authController.healthCheck);
// Public authentication routes
router.post('/register', security_middleware_1.authRateLimit, transform_middleware_1.transformFrontendToBackend, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.register), authController.register);
// Contractor registration endpoint
router.post('/contractor/register', security_middleware_1.authRateLimit, transform_middleware_1.transformFrontendToBackend, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.contractorRegister), authController.contractorRegister);
// Email-based login flow routes
router.post('/login/email/lookup', security_middleware_1.authRateLimit, authController.lookupEmailForLogin);
router.post('/login/email/send-otp', security_middleware_1.authRateLimit, authController.sendLoginOTPToPhone);
router.post('/login/email/verify-otp', security_middleware_1.authRateLimit, authController.verifyLoginOTP);
router.post('/login', security_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.login), authController.login);
router.post('/refresh', (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.refreshToken), authController.refreshToken);
// Password strength check (no rate limiting - just a utility)
router.post('/password/strength', authController.checkPasswordStrength);
// Password reset routes
router.post('/password/reset/request', security_middleware_1.passwordResetRateLimit, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.resetPassword), authController.requestPasswordReset);
router.post('/password/reset/confirm', security_middleware_1.passwordResetRateLimit, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.confirmResetPassword), authController.resetPassword);
// Protected routes
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.get('/profile', authMiddleware.authenticate, authController.getProfile);
router.put('/profile', authMiddleware.authenticate, authController.updateProfile);
router.post('/password/change', authMiddleware.authenticate, (0, validation_middleware_1.validate)(validation_utils_1.validationSchemas.changePassword), authController.changePassword);
// Phone verification routes
router.post('/phone/send-otp', security_middleware_1.authRateLimit, authController.sendPhoneOTP);
router.post('/phone/verify-otp', security_middleware_1.authRateLimit, authController.verifyPhoneOTP);
// Email verification routes
router.post('/email/send-verification', security_middleware_1.authRateLimit, authController.sendEmailVerification);
router.post('/email/verify-token', authController.verifyEmailToken);
router.post('/email/send-otp', security_middleware_1.authRateLimit, authController.sendEmailOTP);
router.post('/email/verify-otp', security_middleware_1.authRateLimit, authController.verifyEmailOTP);
// Phone number utilities
router.get('/phone/countries', authController.getSupportedCountries);
router.post('/phone/validate', authController.validatePhoneNumber);
// Test routes for SMS OTP (development only)
if (process.env.NODE_ENV === 'development') {
    router.post('/test/sms/send', security_middleware_1.authRateLimit, authController.sendTestOTP);
    router.post('/test/sms/verify', security_middleware_1.authRateLimit, authController.verifyTestOTP);
    // 🚀 DEVELOPMENT HELPER: Get dummy OTP information
    router.get('/dev/dummy-otp-info', authController.getDummyOTPInfo);
}
exports.default = router;
//# sourceMappingURL=auth.routes.js.map