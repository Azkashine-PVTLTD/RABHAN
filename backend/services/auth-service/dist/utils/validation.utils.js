"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchemas = exports.transformFrontendData = exports.ValidationUtils = void 0;
const joi_1 = __importDefault(require("joi"));
class ValidationUtils {
    static SAUDI_PHONE_REGEX = /^(\+966|0)?5[0-9]{8}$/;
    static INDIAN_PHONE_REGEX = /^\+91[6-9][0-9]{9}$/;
    static MULTI_COUNTRY_PHONE_REGEX = /^(\+966[5][0-9]{8}|\+91[6-9][0-9]{9}|\+1[2-9][0-9]{9})$/;
    static SAUDI_NATIONAL_ID_REGEX = /^[12][0-9]{9}$/;
    static EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    static validateEmail(email) {
        return this.EMAIL_REGEX.test(email);
    }
    static validateSaudiPhone(phone) {
        return this.SAUDI_PHONE_REGEX.test(phone);
    }
    static validateMultiCountryPhone(phone) {
        return this.MULTI_COUNTRY_PHONE_REGEX.test(phone);
    }
    static validateSaudiNationalId(nationalId) {
        if (!this.SAUDI_NATIONAL_ID_REGEX.test(nationalId)) {
            return false;
        }
        const firstDigit = nationalId.charAt(0);
        return firstDigit === '1' || firstDigit === '2';
    }
    static normalizeSaudiPhone(phone) {
        let normalized = phone.replace(/[\s\-\(\)]/g, '');
        if (normalized.startsWith('00966')) {
            normalized = '+966' + normalized.substring(5);
        }
        else if (normalized.startsWith('966')) {
            normalized = '+966' + normalized.substring(3);
        }
        else if (normalized.startsWith('0')) {
            normalized = '+966' + normalized.substring(1);
        }
        else if (!normalized.startsWith('+')) {
            normalized = '+966' + normalized;
        }
        return normalized;
    }
    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"');
    }
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}
exports.ValidationUtils = ValidationUtils;
// Transform camelCase frontend data to snake_case backend format
const transformFrontendData = (data) => {
    const transformed = { ...data };
    // Transform field names - prioritize camelCase, fallback to snake_case
    if (data.firstName && !data.first_name) {
        transformed.first_name = data.firstName;
    }
    if (data.lastName && !data.last_name) {
        transformed.last_name = data.lastName;
    }
    if (data.nationalId && !data.national_id) {
        transformed.national_id = data.nationalId;
    }
    // Contractor-specific transformations
    if (data.companyName && !data.company_name) {
        transformed.company_name = data.companyName;
    }
    if (data.crNumber && !data.cr_number) {
        transformed.cr_number = data.crNumber;
    }
    if (data.vatNumber && !data.vat_number) {
        transformed.vat_number = data.vatNumber;
    }
    // Ensure we have the snake_case fields for backend processing
    if (!transformed.first_name && transformed.firstName) {
        transformed.first_name = transformed.firstName;
    }
    if (!transformed.last_name && transformed.lastName) {
        transformed.last_name = transformed.lastName;
    }
    if (!transformed.national_id && transformed.nationalId) {
        transformed.national_id = transformed.nationalId;
    }
    if (!transformed.company_name && transformed.companyName) {
        transformed.company_name = transformed.companyName;
    }
    if (!transformed.cr_number && transformed.crNumber) {
        transformed.cr_number = transformed.crNumber;
    }
    if (!transformed.vat_number && transformed.vatNumber) {
        transformed.vat_number = transformed.vatNumber;
    }
    return transformed;
};
exports.transformFrontendData = transformFrontendData;
exports.validationSchemas = {
    register: joi_1.default.object({
        // Accept frontend camelCase or backend snake_case
        firstName: joi_1.default.string().min(2).max(50).optional(),
        first_name: joi_1.default.string().min(2).max(50).optional(),
        lastName: joi_1.default.string().min(2).max(50).optional(),
        last_name: joi_1.default.string().min(2).max(50).optional(),
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        }),
        phone: joi_1.default.string().pattern(ValidationUtils.MULTI_COUNTRY_PHONE_REGEX).optional().messages({
            'string.pattern.base': 'Please provide a valid phone number (Saudi +966, India +91, or US +1)'
        }),
        nationalId: joi_1.default.string().allow('').optional(),
        national_id: joi_1.default.string().allow('').optional(),
        role: joi_1.default.string().valid('USER', 'CONTRACTOR').optional().default('USER').messages({
            'any.only': 'Role must be either USER or CONTRACTOR'
        }),
        user_type: joi_1.default.string().valid('HOMEOWNER', 'BUSINESS', 'INDUSTRIAL').optional().default('HOMEOWNER').messages({
            'any.only': 'User type must be HOMEOWNER, BUSINESS, or INDUSTRIAL'
        })
    })
        .or('firstName', 'first_name') // Require at least one first name field
        .or('lastName', 'last_name'), // Require at least one last name field
    contractorRegister: joi_1.default.object({
        // Accept frontend camelCase or backend snake_case
        firstName: joi_1.default.string().min(2).max(50).optional(),
        first_name: joi_1.default.string().min(2).max(50).optional(),
        lastName: joi_1.default.string().min(2).max(50).optional(),
        last_name: joi_1.default.string().min(2).max(50).optional(),
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Please provide a valid business email address',
            'any.required': 'Business email is required'
        }),
        password: joi_1.default.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        }),
        phone: joi_1.default.string().pattern(ValidationUtils.MULTI_COUNTRY_PHONE_REGEX).required().messages({
            'string.pattern.base': 'Please provide a valid business phone number (Saudi +966, India +91, or US +1)',
            'any.required': 'Business phone number is required'
        }),
        // Company basic info for initial registration
        companyName: joi_1.default.string().min(2).max(100).optional(),
        company_name: joi_1.default.string().min(2).max(100).optional(),
        crNumber: joi_1.default.string().allow('').optional(),
        cr_number: joi_1.default.string().allow('').optional(),
        vatNumber: joi_1.default.string().allow('').optional(),
        vat_number: joi_1.default.string().allow('').optional(),
        // Role automatically set to CONTRACTOR
        role: joi_1.default.string().valid('CONTRACTOR').default('CONTRACTOR'),
        user_type: joi_1.default.string().valid('HOMEOWNER', 'BUSINESS', 'INDUSTRIAL').optional().default('BUSINESS').messages({
            'any.only': 'User type must be HOMEOWNER, BUSINESS, or INDUSTRIAL'
        })
    })
        .or('firstName', 'first_name') // Require at least one first name field
        .or('lastName', 'last_name'), // Require at least one last name field
    login: joi_1.default.object({
        email: joi_1.default.string().email().messages({
            'string.email': 'Please provide a valid email address'
        }),
        phone: joi_1.default.string().pattern(ValidationUtils.MULTI_COUNTRY_PHONE_REGEX).messages({
            'string.pattern.base': 'Please provide a valid phone number (Saudi +966, India +91, or US +1)'
        }),
        password: joi_1.default.string().required().messages({
            'any.required': 'Password is required'
        }),
        deviceId: joi_1.default.string().optional()
    }).or('email', 'phone').messages({
        'object.missing': 'Either email or phone number is required'
    }),
    refreshToken: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'any.required': 'Refresh token is required'
        })
    }),
    resetPassword: joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
    }),
    confirmResetPassword: joi_1.default.object({
        token: joi_1.default.string().required().messages({
            'any.required': 'Reset token is required'
        }),
        newPassword: joi_1.default.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'New password is required'
        })
    }),
    changePassword: joi_1.default.object({
        oldPassword: joi_1.default.string().required().messages({
            'any.required': 'Old password is required'
        }),
        newPassword: joi_1.default.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'New password is required'
        })
    })
};
//# sourceMappingURL=validation.utils.js.map