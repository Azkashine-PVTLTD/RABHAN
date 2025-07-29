"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearchParams = exports.validatePaginationParams = exports.validateUpdateDocumentStatus = exports.validateUpdateProfile = exports.validateCreateRegistrationProfile = exports.validateCreateProfile = void 0;
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../types");
// Saudi-specific validation patterns
const SAUDI_POSTAL_CODE = /^\d{5}$/;
const SAUDI_PHONE = /^(5|50|53|54|55|56|57|58|59)\d{7}$/;
const METER_NUMBER = /^[A-Z0-9]{6,15}$/;
const NAME_PATTERN = /^[a-zA-Z\u0600-\u06FF\s]+$/;
// Validation schemas
const createProfileSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
    firstName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    lastName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    // Address
    region: joi_1.default.string().valid('riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim', 'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah').required(),
    city: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    district: joi_1.default.string().min(2).max(50).required(),
    streetAddress: joi_1.default.string().min(5).max(100).required(),
    landmark: joi_1.default.string().max(100).optional(),
    postalCode: joi_1.default.string().pattern(SAUDI_POSTAL_CODE).required(),
    // Property
    propertyType: joi_1.default.string().valid('VILLA', 'APARTMENT', 'DUPLEX', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER').required(),
    propertyOwnership: joi_1.default.string().valid('OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED').required(),
    roofSize: joi_1.default.number().min(10).max(10000).required(),
    gpsLatitude: joi_1.default.number().min(-90).max(90).required(),
    gpsLongitude: joi_1.default.number().min(-180).max(180).required(),
    electricityConsumption: joi_1.default.string().min(1).max(50).required(),
    electricityMeterNumber: joi_1.default.string().pattern(METER_NUMBER).required(),
    // Preferences
    preferredLanguage: joi_1.default.string().valid('en', 'ar').default('ar'),
    emailNotifications: joi_1.default.boolean().default(true),
    smsNotifications: joi_1.default.boolean().default(true),
    marketingConsent: joi_1.default.boolean().default(false)
});
const updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN),
    lastName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN),
    // Address
    region: joi_1.default.string().valid('riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim', 'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah'),
    city: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN),
    district: joi_1.default.string().min(2).max(50),
    streetAddress: joi_1.default.string().min(5).max(100),
    landmark: joi_1.default.string().max(100).allow(''),
    postalCode: joi_1.default.string().pattern(SAUDI_POSTAL_CODE),
    // Property
    propertyType: joi_1.default.string().valid('VILLA', 'APARTMENT', 'DUPLEX', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER'),
    propertyOwnership: joi_1.default.string().valid('OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED'),
    roofSize: joi_1.default.number().min(10).max(10000),
    gpsLatitude: joi_1.default.number().min(-90).max(90),
    gpsLongitude: joi_1.default.number().min(-180).max(180),
    electricityConsumption: joi_1.default.string().min(1).max(50),
    electricityMeterNumber: joi_1.default.string().pattern(METER_NUMBER),
    // Preferences
    preferredLanguage: joi_1.default.string().valid('en', 'ar'),
    emailNotifications: joi_1.default.boolean(),
    smsNotifications: joi_1.default.boolean(),
    marketingConsent: joi_1.default.boolean(),
    // Employment Information (matching frontend values)
    employment_status: joi_1.default.string().valid('government', 'private', 'selfEmployed', 'student', 'retired'),
    employer_name: joi_1.default.string().min(2).max(100),
    job_title: joi_1.default.string().min(2).max(100),
    monthly_income: joi_1.default.string().min(1).max(20), // Allow as string for flexible formatting
    years_employed: joi_1.default.string().min(1).max(10), // Allow as string for flexible formatting
    // Personal Information
    date_of_birth: joi_1.default.date().max('now').min('1900-01-01'),
    marital_status: joi_1.default.string().valid('single', 'married', 'divorced', 'widowed'),
    dependents: joi_1.default.alternatives().try(joi_1.default.number().integer().min(0).max(20), joi_1.default.string().pattern(/^\d{1,2}$/).custom((value) => parseInt(value, 10)))
}).min(1); // At least one field must be provided
const createRegistrationProfileSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().optional(), // Optional during registration
    firstName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    lastName: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    // Address
    region: joi_1.default.string().valid('riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim', 'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah').required(),
    city: joi_1.default.string().min(2).max(50).pattern(NAME_PATTERN).required(),
    district: joi_1.default.string().min(2).max(50).optional(),
    streetAddress: joi_1.default.string().min(5).max(100).optional(),
    landmark: joi_1.default.string().max(100).optional(),
    postalCode: joi_1.default.string().pattern(SAUDI_POSTAL_CODE).optional(),
    // Property
    propertyType: joi_1.default.string().valid('VILLA', 'APARTMENT', 'DUPLEX', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER').required(),
    propertyOwnership: joi_1.default.string().valid('OWNED', 'RENTED', 'LEASED', 'FAMILY_OWNED').required(),
    roofSize: joi_1.default.number().min(10).max(10000).required(),
    gpsLatitude: joi_1.default.number().min(-90).max(90).required(),
    gpsLongitude: joi_1.default.number().min(-180).max(180).required(),
    electricityConsumption: joi_1.default.string().min(1).max(50).required(),
    electricityMeterNumber: joi_1.default.string().pattern(METER_NUMBER).required(),
    // Preferences
    preferredLanguage: joi_1.default.string().valid('en', 'ar').default('ar'),
    emailNotifications: joi_1.default.boolean().default(true),
    smsNotifications: joi_1.default.boolean().default(true),
    marketingConsent: joi_1.default.boolean().default(false)
});
const updateDocumentStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid('verified', 'rejected').required(),
    rejectionReason: joi_1.default.when('status', {
        is: 'rejected',
        then: joi_1.default.string().min(10).max(500).required(),
        otherwise: joi_1.default.forbidden()
    })
});
// Validation middleware
const validateCreateProfile = (req, res, next) => {
    const { error, value } = createProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        throw new types_1.ValidationError('Validation failed', details);
    }
    // GPS coordinates are already validated by Joi schema for valid lat/lng ranges
    // No additional location restrictions
    req.body = value;
    next();
};
exports.validateCreateProfile = validateCreateProfile;
const validateCreateRegistrationProfile = (req, res, next) => {
    const { error, value } = createRegistrationProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        throw new types_1.ValidationError('Validation failed', details);
    }
    // GPS coordinates are already validated by Joi schema for valid lat/lng ranges
    // No additional location restrictions
    req.body = value;
    next();
};
exports.validateCreateRegistrationProfile = validateCreateRegistrationProfile;
const validateUpdateProfile = (req, res, next) => {
    console.log('🔍 Validating profile update with body:', req.body);
    const { error, value } = updateProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        console.log('❌ Validation failed:', error.details);
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        console.log('📋 Validation error details:', details);
        throw new types_1.ValidationError('Validation failed', details);
    }
    console.log('✅ Validation passed, cleaned body:', value);
    // GPS coordinates are already validated by Joi schema for valid lat/lng ranges
    // No additional location restrictions
    req.body = value;
    next();
};
exports.validateUpdateProfile = validateUpdateProfile;
const validateUpdateDocumentStatus = (req, res, next) => {
    const { error, value } = updateDocumentStatusSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const details = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        throw new types_1.ValidationError('Validation failed', details);
    }
    req.body = value;
    next();
};
exports.validateUpdateDocumentStatus = validateUpdateDocumentStatus;
// Query parameter validation
const validatePaginationParams = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sortBy: joi_1.default.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'city', 'profileCompletionPercentage').default('createdAt'),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
    });
    const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        throw new types_1.ValidationError('Invalid query parameters');
    }
    req.query = value;
    next();
};
exports.validatePaginationParams = validatePaginationParams;
const validateSearchParams = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        region: joi_1.default.string().valid('riyadh', 'makkah', 'eastern', 'asir', 'tabuk', 'qassim', 'hail', 'northern', 'jazan', 'najran', 'bahah', 'jouf', 'madinah'),
        city: joi_1.default.string().min(2).max(50),
        propertyType: joi_1.default.string().valid('VILLA', 'APARTMENT', 'DUPLEX', 'TOWNHOUSE', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER'),
        bnplEligible: joi_1.default.boolean(),
        profileCompleted: joi_1.default.boolean()
    });
    const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        throw new types_1.ValidationError('Invalid search parameters');
    }
    req.query = value;
    next();
};
exports.validateSearchParams = validateSearchParams;
//# sourceMappingURL=user.validator.js.map