"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const phone_verification_service_1 = require("../services/phone-verification.service");
const email_verification_service_1 = require("../services/email-verification.service");
const logger_1 = require("../utils/logger");
const password_utils_1 = require("../utils/password.utils");
class AuthController {
    authService;
    phoneVerificationService;
    emailVerificationService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
        this.phoneVerificationService = new phone_verification_service_1.PhoneVerificationService();
        this.emailVerificationService = new email_verification_service_1.EmailVerificationService();
    }
    register = async (req, res) => {
        try {
            // Data is already transformed by middleware
            const data = req.body;
            // Validate Saudi National ID if provided
            if (data.national_id) {
                if (!data.national_id.match(/^[12][0-9]{9}$/)) {
                    logger_1.SAMALogger.logComplianceViolation('INVALID_NATIONAL_ID', undefined, {
                        nationalId: data.national_id,
                        ip: req.ip
                    });
                    res.status(400).json({
                        error: 'Invalid Saudi National ID format',
                        compliance: 'SAMA_BNPL_RULES'
                    });
                    return;
                }
            }
            const tokens = await this.authService.register(data);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: tokens
            });
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Email already registered')) {
                    res.status(409).json({ error: 'Email already registered' });
                }
                else if (error.message.includes('National ID already registered')) {
                    res.status(409).json({ error: 'National ID already registered' });
                }
                else if (error.message.includes('Password must')) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Registration failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Registration failed' });
            }
        }
    };
    contractorRegister = async (req, res) => {
        try {
            // Data is already transformed by middleware
            const data = req.body;
            // Store company info separately (will be added to contractor profile later)
            const companyInfo = {
                companyName: data.company_name || data.companyName,
                crNumber: data.cr_number || data.crNumber,
                vatNumber: data.vat_number || data.vatNumber
            };
            // Remove company fields from user registration data (they don't exist in users table)
            delete data.company_name;
            delete data.companyName;
            delete data.cr_number;
            delete data.crNumber;
            delete data.vat_number;
            delete data.vatNumber;
            // Force role to CONTRACTOR for contractor registration
            data.role = 'CONTRACTOR';
            // Set default contractor type if not provided
            if (!data.user_type) {
                data.user_type = 'BUSINESS';
            }
            // Log contractor registration attempt
            logger_1.SAMALogger.logAuthEvent('CONTRACTOR_REGISTRATION_ATTEMPT', undefined, {
                email: data.email,
                companyName: companyInfo.companyName,
                userType: data.user_type,
                ip: req.ip
            });
            const tokens = await this.authService.register(data);
            // Log successful contractor registration
            logger_1.SAMALogger.logAuthEvent('CONTRACTOR_REGISTRATION_SUCCESS', tokens.user?.id, {
                email: data.email,
                companyName: companyInfo.companyName,
                userType: data.user_type,
                ip: req.ip,
                compliance: 'SAMA_THIRD_PARTY_FRAMEWORK'
            });
            res.status(201).json({
                success: true,
                message: 'Contractor registered successfully',
                data: tokens
            });
        }
        catch (error) {
            logger_1.logger.error('Contractor registration error:', error);
            // Log failed contractor registration
            logger_1.SAMALogger.logAuthEvent('CONTRACTOR_REGISTRATION_FAILED', undefined, {
                email: req.body.email,
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip,
                compliance: 'SAMA_THIRD_PARTY_FRAMEWORK'
            });
            if (error instanceof Error) {
                if (error.message.includes('Email already registered')) {
                    res.status(409).json({ error: 'Business email already registered' });
                }
                else if (error.message.includes('Phone already registered')) {
                    res.status(409).json({ error: 'Business phone already registered' });
                }
                else if (error.message.includes('Password must')) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Contractor registration failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Contractor registration failed' });
            }
        }
    };
    login = async (req, res) => {
        try {
            const data = req.body;
            const tokens = await this.authService.login(data);
            res.json({
                success: true,
                message: 'Login successful',
                data: tokens
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid credentials')) {
                    res.status(401).json({ error: 'Invalid credentials' });
                }
                else if (error.message.includes('Account temporarily locked')) {
                    res.status(423).json({ error: 'Account temporarily locked. Please try again later.' });
                }
                else if (error.message.includes('Account is not active')) {
                    res.status(403).json({ error: 'Account is not active' });
                }
                else {
                    res.status(500).json({ error: 'Login failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Login failed' });
            }
        }
    };
    refreshToken = async (req, res) => {
        try {
            const data = req.body;
            const tokens = await this.authService.refreshToken(data.refreshToken);
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: tokens
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid refresh token')) {
                    res.status(401).json({ error: 'Invalid refresh token' });
                }
                else if (error.message.includes('expired')) {
                    res.status(401).json({ error: 'Refresh token expired' });
                }
                else {
                    res.status(500).json({ error: 'Token refresh failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Token refresh failed' });
            }
        }
    };
    logout = async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            await this.authService.logout(req.user.id, req.user.sessionId);
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    };
    getProfile = async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const user = await this.authService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            // Remove sensitive information
            const { password_hash, mfa_secret, ...userProfile } = user;
            res.json({
                success: true,
                data: userProfile
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    };
    updateProfile = async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const { first_name, last_name, email, phone } = req.body;
            // Validate input data
            const updateData = {};
            if (first_name !== undefined)
                updateData.first_name = first_name;
            if (last_name !== undefined)
                updateData.last_name = last_name;
            if (email !== undefined)
                updateData.email = email;
            if (phone !== undefined)
                updateData.phone = phone;
            // Check if there's anything to update
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ error: 'No valid fields to update' });
                return;
            }
            // Update user profile in database
            await this.authService.updateUserProfile(req.user.id, updateData);
            // Get updated user data
            const updatedUser = await this.authService.getUserById(req.user.id);
            if (!updatedUser) {
                res.status(404).json({ error: 'User not found after update' });
                return;
            }
            // Remove sensitive information
            const { password_hash, mfa_secret, ...userProfile } = updatedUser;
            res.json({
                success: true,
                data: userProfile,
                message: 'Profile updated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    };
    checkPasswordStrength = async (req, res) => {
        try {
            const { password } = req.body;
            if (!password) {
                res.status(400).json({ error: 'Password is required' });
                return;
            }
            const strengthCheck = password_utils_1.PasswordUtils.checkPasswordStrength(password);
            res.json({
                success: true,
                data: strengthCheck
            });
        }
        catch (error) {
            logger_1.logger.error('Password strength check error:', error);
            res.status(500).json({ error: 'Password strength check failed' });
        }
    };
    requestPasswordReset = async (req, res) => {
        try {
            const { email } = req.body;
            await this.authService.requestPasswordReset(email);
            // Always return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            res.status(500).json({ error: 'Password reset request failed' });
        }
    };
    resetPassword = async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            await this.authService.resetPassword(token, newPassword);
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid or expired reset token')) {
                    res.status(400).json({ error: 'Invalid or expired reset token' });
                }
                else if (error.message.includes('Password must')) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Password reset failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Password reset failed' });
            }
        }
    };
    changePassword = async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const { oldPassword, newPassword } = req.body;
            await this.authService.changePassword(req.user.id, oldPassword, newPassword);
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Password change error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid old password')) {
                    res.status(400).json({ error: 'Invalid old password' });
                }
                else if (error.message.includes('Password must')) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Password change failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Password change failed' });
            }
        }
    };
    // Phone verification endpoints
    sendPhoneOTP = async (req, res) => {
        try {
            const { phoneNumber } = req.body;
            const userId = undefined; // No user ID for registration flow
            if (!phoneNumber) {
                res.status(400).json({ error: 'Phone number is required' });
                return;
            }
            await this.phoneVerificationService.sendOTP(phoneNumber, userId);
            res.json({
                success: true,
                message: 'OTP sent successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Send phone OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid Saudi phone number')) {
                    res.status(400).json({ error: 'Invalid Saudi phone number format' });
                }
                else if (error.message.includes('Too many OTP requests')) {
                    res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
                }
                else if (error.message.includes('Invalid phone number')) {
                    res.status(400).json({ error: 'Invalid phone number' });
                }
                else {
                    res.status(500).json({ error: 'Failed to send OTP' });
                }
            }
            else {
                res.status(500).json({ error: 'Failed to send OTP' });
            }
        }
    };
    verifyPhoneOTP = async (req, res) => {
        try {
            const { phoneNumber, otp } = req.body;
            const userId = undefined; // No user ID for registration flow
            if (!phoneNumber || !otp) {
                res.status(400).json({ error: 'Phone number and OTP are required' });
                return;
            }
            const isValid = await this.phoneVerificationService.verifyOTP(phoneNumber, otp, userId);
            if (isValid) {
                res.json({
                    success: true,
                    message: 'Phone verification successful'
                });
            }
            else {
                res.status(400).json({ error: 'Invalid OTP' });
            }
        }
        catch (error) {
            logger_1.logger.error('Verify phone OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    res.status(400).json({ error: 'OTP expired. Please request a new one.' });
                }
                else if (error.message.includes('Invalid OTP')) {
                    res.status(400).json({ error: 'Invalid OTP' });
                }
                else {
                    res.status(500).json({ error: 'Phone verification failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Phone verification failed' });
            }
        }
    };
    // Email verification endpoints
    sendEmailVerification = async (req, res) => {
        try {
            const { email, userFullName } = req.body;
            const userId = req.user?.id;
            if (!email || !userId) {
                res.status(400).json({ error: 'Email and user ID are required' });
                return;
            }
            await this.emailVerificationService.sendVerificationEmail(email, userId, userFullName);
            res.json({
                success: true,
                message: 'Verification email sent successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Send email verification error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Too many email verification requests')) {
                    res.status(429).json({ error: 'Too many verification requests. Please try again later.' });
                }
                else {
                    res.status(500).json({ error: 'Failed to send verification email' });
                }
            }
            else {
                res.status(500).json({ error: 'Failed to send verification email' });
            }
        }
    };
    verifyEmailToken = async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ error: 'Verification token is required' });
                return;
            }
            const result = await this.emailVerificationService.verifyToken(token);
            res.json({
                success: true,
                message: 'Email verification successful',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Verify email token error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    res.status(400).json({ error: 'Verification token expired. Please request a new one.' });
                }
                else if (error.message.includes('not found')) {
                    res.status(400).json({ error: 'Invalid verification token' });
                }
                else {
                    res.status(500).json({ error: 'Email verification failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Email verification failed' });
            }
        }
    };
    sendEmailOTP = async (req, res) => {
        try {
            const { email } = req.body;
            const userId = req.user?.id;
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            await this.emailVerificationService.sendOTPEmail(email, userId);
            res.json({
                success: true,
                message: 'Email OTP sent successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Send email OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Too many email OTP requests')) {
                    res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
                }
                else {
                    res.status(500).json({ error: 'Failed to send email OTP' });
                }
            }
            else {
                res.status(500).json({ error: 'Failed to send email OTP' });
            }
        }
    };
    verifyEmailOTP = async (req, res) => {
        try {
            const { email, otp } = req.body;
            const userId = req.user?.id;
            if (!email || !otp) {
                res.status(400).json({ error: 'Email and OTP are required' });
                return;
            }
            const isValid = await this.emailVerificationService.verifyOTP(email, otp, userId);
            if (isValid) {
                res.json({
                    success: true,
                    message: 'Email OTP verification successful'
                });
            }
            else {
                res.status(400).json({ error: 'Invalid OTP' });
            }
        }
        catch (error) {
            logger_1.logger.error('Verify email OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    res.status(400).json({ error: 'OTP expired. Please request a new one.' });
                }
                else if (error.message.includes('Invalid OTP')) {
                    res.status(400).json({ error: 'Invalid OTP' });
                }
                else {
                    res.status(500).json({ error: 'Email OTP verification failed' });
                }
            }
            else {
                res.status(500).json({ error: 'Email OTP verification failed' });
            }
        }
    };
    // SMS OTP Test Endpoints
    sendTestOTP = async (req, res) => {
        try {
            const { phoneNumber, countryCode } = req.body;
            if (!phoneNumber) {
                res.status(400).json({ error: 'Phone number is required' });
                return;
            }
            // Validate phone number first
            const validation = this.phoneVerificationService.validatePhoneNumberPublic(phoneNumber, countryCode);
            if (!validation.isValid) {
                res.status(400).json({
                    error: validation.country ?
                        `Invalid ${validation.countryName} phone number format` :
                        'Invalid phone number format',
                    supportedCountries: this.phoneVerificationService.getSupportedCountries()
                });
                return;
            }
            await this.phoneVerificationService.sendOTP(phoneNumber, 'test-user', countryCode);
            res.json({
                success: true,
                message: 'OTP sent successfully',
                data: {
                    phoneNumber: validation.formatted,
                    country: validation.country,
                    countryName: validation.countryName,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Send test OTP error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to send OTP',
                phoneNumber: req.body.phoneNumber
            });
        }
    };
    verifyTestOTP = async (req, res) => {
        try {
            const { phoneNumber, otp, countryCode } = req.body;
            if (!phoneNumber || !otp) {
                res.status(400).json({ error: 'Phone number and OTP are required' });
                return;
            }
            // Validate phone number format
            const validation = this.phoneVerificationService.validatePhoneNumberPublic(phoneNumber, countryCode);
            if (!validation.isValid) {
                res.status(400).json({
                    error: 'Invalid phone number format',
                    supportedCountries: this.phoneVerificationService.getSupportedCountries()
                });
                return;
            }
            const isValid = await this.phoneVerificationService.verifyOTP(phoneNumber, otp, 'test-user', countryCode);
            if (isValid) {
                res.json({
                    success: true,
                    message: 'OTP verified successfully',
                    data: {
                        phoneNumber: validation.formatted,
                        country: validation.country,
                        countryName: validation.countryName,
                        verified: true,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: 'Invalid OTP'
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Verify test OTP error:', error);
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to verify OTP',
                phoneNumber: req.body.phoneNumber
            });
        }
    };
    // Get supported countries endpoint
    getSupportedCountries = async (_req, res) => {
        try {
            const countries = this.phoneVerificationService.getSupportedCountries();
            res.json({
                success: true,
                data: {
                    countries,
                    defaultCountry: 'SA', // Saudi Arabia as default for RABHAN
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get supported countries error:', error);
            res.status(500).json({ error: 'Failed to get supported countries' });
        }
    };
    // Validate phone number endpoint
    validatePhoneNumber = async (req, res) => {
        try {
            const { phoneNumber, countryCode } = req.body;
            if (!phoneNumber) {
                res.status(400).json({ error: 'Phone number is required' });
                return;
            }
            const validation = this.phoneVerificationService.validatePhoneNumberPublic(phoneNumber, countryCode);
            res.json({
                success: true,
                data: {
                    ...validation,
                    supportedCountries: this.phoneVerificationService.getSupportedCountries()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Validate phone number error:', error);
            res.status(500).json({ error: 'Phone number validation failed' });
        }
    };
    // Email-based login flow endpoints
    lookupEmailForLogin = async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            const result = await this.authService.lookupUserByEmail(email);
            if (!result) {
                // Don't reveal if email exists or not (security)
                res.json({
                    success: true,
                    message: 'If the email is registered, OTP will be sent to the associated phone number'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    hasPhone: !!result.phone,
                    maskedPhone: result.maskedPhone,
                    userExists: true
                },
                message: 'User found. OTP will be sent to registered phone number.'
            });
        }
        catch (error) {
            logger_1.logger.error('Email lookup error:', error);
            res.status(500).json({ error: 'Email lookup failed' });
        }
    };
    sendLoginOTPToPhone = async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            const result = await this.authService.sendLoginOTPByEmail(email);
            if (result) {
                res.json({
                    success: true,
                    message: 'OTP sent successfully',
                    data: {
                        maskedPhone: result.maskedPhone
                    }
                });
            }
            else {
                // Always return success to prevent email enumeration
                res.json({
                    success: true,
                    message: 'If the email is registered, OTP has been sent'
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Send login OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Too many OTP requests')) {
                    res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
                }
                else if (error.message.includes('No phone number')) {
                    res.status(400).json({ error: 'No phone number associated with this account' });
                }
                else {
                    res.status(500).json({ error: 'Failed to send OTP' });
                }
            }
            else {
                res.status(500).json({ error: 'Failed to send OTP' });
            }
        }
    };
    verifyLoginOTP = async (req, res) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                res.status(400).json({ error: 'Email and OTP are required' });
                return;
            }
            const isValid = await this.authService.verifyLoginOTP(email, otp);
            if (isValid) {
                res.json({
                    success: true,
                    message: 'OTP verification successful. You can now enter your password.',
                    data: {
                        otpVerified: true,
                        canProceedToPassword: true
                    }
                });
            }
            else {
                res.status(400).json({ error: 'Invalid or expired OTP' });
            }
        }
        catch (error) {
            logger_1.logger.error('Verify login OTP error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    res.status(400).json({ error: 'OTP expired. Please request a new one.' });
                }
                else if (error.message.includes('Invalid OTP')) {
                    res.status(400).json({ error: 'Invalid OTP' });
                }
                else {
                    res.status(500).json({ error: 'OTP verification failed' });
                }
            }
            else {
                res.status(500).json({ error: 'OTP verification failed' });
            }
        }
    };
    healthCheck = async (_req, res) => {
        try {
            res.json({
                success: true,
                message: 'Auth service is healthy',
                timestamp: new Date().toISOString(),
                service: 'auth-service',
                version: '1.0.0'
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Health check failed' });
        }
    };
    // 🚀 DEVELOPMENT ONLY: Get dummy OTP info for testing
    getDummyOTPInfo = async (req, res) => {
        try {
            // Only allow in development mode
            if (!this.phoneVerificationService.isDummyOTPMode()) {
                res.status(403).json({
                    error: 'This endpoint is only available in development mode',
                    production: true
                });
                return;
            }
            const { phoneNumber } = req.query;
            if (!phoneNumber) {
                res.json({
                    success: true,
                    message: '🧪 Development Mode: Dummy OTP Information',
                    data: {
                        dummyOTP: this.phoneVerificationService.getDummyOTP(),
                        developmentMode: true,
                        instructions: 'Use this OTP for any phone number during development',
                        note: 'Twilio SMS is bypassed in development mode'
                    }
                });
                return;
            }
            // Test with specific phone number
            const testInfo = await this.phoneVerificationService.testOTPVerification(phoneNumber);
            res.json({
                success: true,
                message: '🧪 Development Mode: Test OTP Info',
                data: {
                    ...testInfo,
                    developmentMode: true,
                    instructions: 'Use this OTP to verify the phone number',
                    phoneNumber: phoneNumber
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get dummy OTP info error:', error);
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to get dummy OTP info'
            });
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map