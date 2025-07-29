"use strict";
// User Service Types and Interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.UserServiceError = exports.VerificationStatus = exports.UploadStatus = exports.DocumentType = exports.EmploymentStatus = exports.PreferredLanguage = exports.ElectricityConsumptionRange = exports.PropertyOwnership = exports.PropertyType = void 0;
// Enums matching database
var PropertyType;
(function (PropertyType) {
    PropertyType["VILLA"] = "VILLA";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["DUPLEX"] = "DUPLEX";
    PropertyType["TOWNHOUSE"] = "TOWNHOUSE";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
    PropertyType["INDUSTRIAL"] = "INDUSTRIAL";
    PropertyType["OTHER"] = "OTHER";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var PropertyOwnership;
(function (PropertyOwnership) {
    PropertyOwnership["OWNED"] = "OWNED";
    PropertyOwnership["RENTED"] = "RENTED";
    PropertyOwnership["LEASED"] = "LEASED";
    PropertyOwnership["FAMILY_OWNED"] = "FAMILY_OWNED";
})(PropertyOwnership || (exports.PropertyOwnership = PropertyOwnership = {}));
var ElectricityConsumptionRange;
(function (ElectricityConsumptionRange) {
    ElectricityConsumptionRange["RANGE_0_200"] = "0_200";
    ElectricityConsumptionRange["RANGE_200_400"] = "200_400";
    ElectricityConsumptionRange["RANGE_400_600"] = "400_600";
    ElectricityConsumptionRange["RANGE_600_800"] = "600_800";
    ElectricityConsumptionRange["RANGE_800_1000"] = "800_1000";
    ElectricityConsumptionRange["RANGE_1000_1200"] = "1000_1200";
    ElectricityConsumptionRange["RANGE_1200_1500"] = "1200_1500";
    ElectricityConsumptionRange["RANGE_1500_PLUS"] = "1500_PLUS";
})(ElectricityConsumptionRange || (exports.ElectricityConsumptionRange = ElectricityConsumptionRange = {}));
var PreferredLanguage;
(function (PreferredLanguage) {
    PreferredLanguage["ENGLISH"] = "en";
    PreferredLanguage["ARABIC"] = "ar";
})(PreferredLanguage || (exports.PreferredLanguage = PreferredLanguage = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["GOVERNMENT"] = "government";
    EmploymentStatus["PRIVATE"] = "private";
    EmploymentStatus["SELF_EMPLOYED"] = "selfEmployed";
    EmploymentStatus["STUDENT"] = "student";
    EmploymentStatus["RETIRED"] = "retired";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["NATIONAL_ID_FRONT"] = "national_id_front";
    DocumentType["NATIONAL_ID_BACK"] = "national_id_back";
    DocumentType["PROOF_OF_ADDRESS"] = "proof_of_address";
    DocumentType["SALARY_CERTIFICATE"] = "salary_certificate";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var UploadStatus;
(function (UploadStatus) {
    UploadStatus["PENDING"] = "pending";
    UploadStatus["UPLOADED"] = "uploaded";
    UploadStatus["PROCESSING"] = "processing";
    UploadStatus["FAILED"] = "failed";
})(UploadStatus || (exports.UploadStatus = UploadStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["EXPIRED"] = "expired";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
// Error Types
class UserServiceError extends Error {
    message;
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.message = message;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'UserServiceError';
    }
}
exports.UserServiceError = UserServiceError;
class ValidationError extends UserServiceError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends UserServiceError {
    constructor(message, details) {
        super(message, 'NOT_FOUND', 404, details);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends UserServiceError {
    constructor(message, details) {
        super(message, 'CONFLICT', 409, details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends UserServiceError {
    constructor(message, details) {
        super(message, 'UNAUTHORIZED', 401, details);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ComplianceError extends UserServiceError {
    constructor(message, details) {
        super(message, 'COMPLIANCE_ERROR', 403, details);
        this.name = 'ComplianceError';
    }
}
exports.ComplianceError = ComplianceError;
//# sourceMappingURL=index.js.map