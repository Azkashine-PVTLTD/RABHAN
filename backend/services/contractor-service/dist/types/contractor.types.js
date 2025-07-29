"use strict";
// RABHAN Contractor Management Service Types
// SAMA Compliant with Enhanced Security and Audit Trails
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.CertificationType = exports.ServiceCategory = exports.BusinessType = exports.ContractorStatus = void 0;
// Enums
var ContractorStatus;
(function (ContractorStatus) {
    ContractorStatus["PENDING"] = "pending";
    ContractorStatus["DOCUMENTS_REQUIRED"] = "documents_required";
    ContractorStatus["VERIFICATION"] = "verification";
    ContractorStatus["VERIFIED"] = "verified";
    ContractorStatus["ACTIVE"] = "active";
    ContractorStatus["SUSPENDED"] = "suspended";
    ContractorStatus["REJECTED"] = "rejected";
    ContractorStatus["INACTIVE"] = "inactive";
})(ContractorStatus || (exports.ContractorStatus = ContractorStatus = {}));
var BusinessType;
(function (BusinessType) {
    BusinessType["INDIVIDUAL"] = "individual";
    BusinessType["LLC"] = "llc";
    BusinessType["CORPORATION"] = "corporation";
    BusinessType["PARTNERSHIP"] = "partnership";
    BusinessType["OTHER"] = "other";
})(BusinessType || (exports.BusinessType = BusinessType = {}));
var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["RESIDENTIAL_SOLAR"] = "residential_solar";
    ServiceCategory["COMMERCIAL_SOLAR"] = "commercial_solar";
    ServiceCategory["INDUSTRIAL_SOLAR"] = "industrial_solar";
    ServiceCategory["MAINTENANCE"] = "maintenance";
    ServiceCategory["CONSULTATION"] = "consultation";
    ServiceCategory["DESIGN"] = "design";
    ServiceCategory["ELECTRICAL"] = "electrical";
    ServiceCategory["ROOFING"] = "roofing";
    ServiceCategory["ALL"] = "all";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
var CertificationType;
(function (CertificationType) {
    CertificationType["ELECTRICAL_LICENSE"] = "electrical_license";
    CertificationType["SOLAR_CERTIFICATION"] = "solar_certification";
    CertificationType["BUSINESS_LICENSE"] = "business_license";
    CertificationType["VAT_CERTIFICATE"] = "vat_certificate";
    CertificationType["COMMERCIAL_REGISTRATION"] = "commercial_registration";
    CertificationType["INSURANCE_CERTIFICATE"] = "insurance_certificate";
    CertificationType["SAFETY_CERTIFICATION"] = "safety_certification";
    CertificationType["OTHER"] = "other";
})(CertificationType || (exports.CertificationType = CertificationType = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["APPROVED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["EXPIRED"] = "expired";
    VerificationStatus["REQUIRES_UPDATE"] = "requires_update";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
//# sourceMappingURL=contractor.types.js.map