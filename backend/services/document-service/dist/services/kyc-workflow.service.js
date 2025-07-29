"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCWorkflowService = exports.UserRole = exports.KYCStatus = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = require("../utils/logger");
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NOT_STARTED"] = "not_started";
    KYCStatus["IN_PROGRESS"] = "in_progress";
    KYCStatus["PENDING_REVIEW"] = "pending_review";
    KYCStatus["APPROVED"] = "approved";
    KYCStatus["REJECTED"] = "rejected";
    KYCStatus["REQUIRES_REVISION"] = "requires_revision";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "customer";
    UserRole["CONTRACTOR"] = "contractor";
})(UserRole || (exports.UserRole = UserRole = {}));
class KYCWorkflowService {
    static instance;
    database;
    static USER_KYC_REQUIREMENTS = [
        'national_id',
        'salary_certificate',
        'bank_statement',
        'employment_contract'
    ];
    static CONTRACTOR_KYC_REQUIREMENTS = [
        'commercial_registration',
        'vat_certificate',
        'municipal_license',
        'chamber_membership',
        'insurance_certificate',
        'bank_account_proof'
    ];
    constructor() {
        this.database = database_config_1.DatabaseConfig.getInstance();
    }
    static getInstance() {
        if (!KYCWorkflowService.instance) {
            KYCWorkflowService.instance = new KYCWorkflowService();
        }
        return KYCWorkflowService.instance;
    }
    async getKYCStatus(userId, userRole) {
        try {
            logger_1.logger.info('Getting KYC status', { userId, userRole });
            const requiredCategories = await this.getRequiredCategories(userRole);
            const uploadedDocuments = await this.getUserDocuments(userId);
            const requirements = requiredCategories.map(category => {
                const uploadedDoc = uploadedDocuments.find(doc => doc.category_name === category.name);
                return {
                    categoryId: category.id,
                    categoryName: category.name,
                    required: true,
                    uploaded: !!uploadedDoc,
                    approved: uploadedDoc?.approval_status === 'approved',
                    documentId: uploadedDoc?.id
                };
            });
            const totalRequired = requirements.length;
            const uploaded = requirements.filter(req => req.uploaded).length;
            const approved = requirements.filter(req => req.approved).length;
            const completionPercentage = Math.round((uploaded / totalRequired) * 100);
            let status;
            if (approved === totalRequired) {
                status = KYCStatus.APPROVED;
            }
            else if (uploaded === totalRequired) {
                status = KYCStatus.PENDING_REVIEW;
            }
            else if (uploaded > 0) {
                status = KYCStatus.IN_PROGRESS;
            }
            else {
                status = KYCStatus.NOT_STARTED;
            }
            const kycStatus = {
                userId,
                userRole,
                status,
                completionPercentage,
                requirements,
                lastUpdated: new Date()
            };
            logger_1.logger.info('KYC status retrieved', {
                userId,
                userRole,
                status,
                completionPercentage,
                totalRequired,
                uploaded,
                approved
            });
            return kycStatus;
        }
        catch (error) {
            logger_1.logger.error('Failed to get KYC status', {
                userId,
                userRole,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Failed to retrieve KYC status');
        }
    }
    async submitForReview(userId, userRole) {
        try {
            logger_1.logger.info('Submitting KYC for review', { userId, userRole });
            const kycStatus = await this.getKYCStatus(userId, userRole);
            const allUploaded = kycStatus.requirements.every(req => req.uploaded);
            if (!allUploaded) {
                throw new Error('All required documents must be uploaded before submission');
            }
            await this.updateDocumentsStatus(userId, 'under_review');
            logger_1.SAMALogger.logDocumentEvent('KYC_SUBMITTED', null, userId, {
                userRole,
                requirements: kycStatus.requirements.length,
                completionPercentage: kycStatus.completionPercentage
            });
            logger_1.logger.info('KYC submitted for review successfully', { userId, userRole });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to submit KYC for review', {
                userId,
                userRole,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async approveKYC(userId, userRole, approvedBy, notes) {
        try {
            logger_1.logger.info('Approving KYC', { userId, userRole, approvedBy });
            const query = `
        UPDATE documents 
        SET approval_status = 'approved',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            approval_notes = $2,
            sama_audit_log = sama_audit_log || $3::jsonb
        WHERE user_id = $4 AND approval_status = 'under_review'
      `;
            const auditEntry = JSON.stringify([{
                    event: 'KYC_APPROVED',
                    timestamp: new Date().toISOString(),
                    approved_by: approvedBy,
                    notes: notes || ''
                }]);
            await this.database.query(query, [approvedBy, notes, auditEntry, userId]);
            logger_1.SAMALogger.logDocumentEvent('KYC_APPROVED', null, userId, {
                userRole,
                approvedBy,
                notes,
                approvalTimestamp: new Date().toISOString()
            });
            logger_1.logger.info('KYC approved successfully', { userId, userRole, approvedBy });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to approve KYC', {
                userId,
                userRole,
                approvedBy,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Failed to approve KYC');
        }
    }
    async rejectKYC(userId, userRole, rejectedBy, reason) {
        try {
            logger_1.logger.info('Rejecting KYC', { userId, userRole, rejectedBy, reason });
            const query = `
        UPDATE documents 
        SET approval_status = 'rejected',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            rejection_reason = $2,
            sama_audit_log = sama_audit_log || $3::jsonb
        WHERE user_id = $4 AND approval_status = 'under_review'
      `;
            const auditEntry = JSON.stringify([{
                    event: 'KYC_REJECTED',
                    timestamp: new Date().toISOString(),
                    rejected_by: rejectedBy,
                    reason: reason
                }]);
            await this.database.query(query, [rejectedBy, reason, auditEntry, userId]);
            logger_1.SAMALogger.logDocumentEvent('KYC_REJECTED', null, userId, {
                userRole,
                rejectedBy,
                reason,
                rejectionTimestamp: new Date().toISOString()
            });
            logger_1.logger.info('KYC rejected', { userId, userRole, rejectedBy, reason });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to reject KYC', {
                userId,
                userRole,
                rejectedBy,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Failed to reject KYC');
        }
    }
    async getPendingReviews(userRole) {
        try {
            let query = `
        SELECT DISTINCT 
          d.user_id,
          COUNT(*) as total_documents,
          COUNT(*) FILTER (WHERE d.approval_status = 'under_review') as pending_documents,
          MAX(d.created_at) as last_upload,
          dc.required_for_role as user_role
        FROM documents d
        JOIN document_categories dc ON d.category_id = dc.id
        WHERE d.approval_status = 'under_review'
      `;
            const params = [];
            if (userRole) {
                query += ` AND dc.required_for_role = $1`;
                params.push(userRole);
            }
            query += `
        GROUP BY d.user_id, dc.required_for_role
        HAVING COUNT(*) FILTER (WHERE d.approval_status = 'under_review') > 0
        ORDER BY last_upload DESC
      `;
            const result = await this.database.query(query, params);
            logger_1.logger.info('Retrieved pending KYC reviews', {
                count: result.rows.length,
                userRole: userRole || 'all'
            });
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending reviews', {
                userRole,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Failed to retrieve pending reviews');
        }
    }
    async getRequiredCategories(userRole) {
        const query = `
      SELECT id, name, description, required_for_role
      FROM document_categories 
      WHERE required_for_role = $1 AND is_active = true
      ORDER BY name
    `;
        const result = await this.database.query(query, [userRole]);
        return result.rows;
    }
    async getUserDocuments(userId) {
        const query = `
      SELECT 
        d.id, d.user_id, d.category_id, d.original_filename,
        d.approval_status, d.status, d.created_at,
        dc.name as category_name, dc.required_for_role
      FROM documents d
      JOIN document_categories dc ON d.category_id = dc.id
      WHERE d.user_id = $1 AND d.status != 'archived'
      ORDER BY d.created_at DESC
    `;
        const result = await this.database.query(query, [userId]);
        return result.rows;
    }
    async updateDocumentsStatus(userId, status) {
        const query = `
      UPDATE documents 
      SET approval_status = $1,
          sama_audit_log = sama_audit_log || $2::jsonb
      WHERE user_id = $3 AND status != 'archived'
    `;
        const auditEntry = JSON.stringify([{
                event: 'STATUS_UPDATE',
                timestamp: new Date().toISOString(),
                new_status: status,
                user_id: userId
            }]);
        await this.database.query(query, [status, auditEntry, userId]);
    }
    getHealthStatus() {
        try {
            return {
                status: 'healthy',
                details: {
                    databaseConnection: true,
                    kycRequirements: {
                        user: KYCWorkflowService.USER_KYC_REQUIREMENTS.length,
                        contractor: KYCWorkflowService.CONTRACTOR_KYC_REQUIREMENTS.length
                    }
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    databaseConnection: false,
                    kycRequirements: {
                        user: 0,
                        contractor: 0
                    }
                }
            };
        }
    }
}
exports.KYCWorkflowService = KYCWorkflowService;
//# sourceMappingURL=kyc-workflow.service.js.map