import { pool, executeQuery } from '../config/database.config';
import { 
  ContractorProfile, 
  ContractorRegistrationData, 
  ContractorSearchQuery, 
  ContractorSearchResult,
  ContractorStatus,
  ContractorDashboardStats,
  VerificationRequest,
  BusinessType,
  ServiceCategory
} from '../types/contractor.types';
import { logger, auditLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ContractorService {
  
  /**
   * Register a new contractor
   * SAMA Compliant with audit logging
   */
  async registerContractor(
    userId: string, 
    contractorData: ContractorRegistrationData,
    requestMetadata: { ip_address?: string; user_agent?: string }
  ): Promise<ContractorProfile> {
    const contractorId = uuidv4();
    
    try {
      // Validate service categories
      this.validateServiceCategories(contractorData.service_categories);
      
      // Check if user already has a contractor profile
      const existingContractor = await this.getContractorByUserId(userId);
      if (existingContractor) {
        throw new Error('User already has a contractor profile');
      }
      
      const query = `
        INSERT INTO contractors (
          id, user_id, business_name, business_name_ar, business_type,
          commercial_registration, vat_number, email, phone, whatsapp,
          website, address_line1, address_line2, city, region, postal_code,
          established_year, employee_count, description, description_ar,
          service_categories, service_areas, years_experience,
          created_by, ip_address, user_agent
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26
        ) RETURNING *
      `;
      
      const values = [
        contractorId,
        userId,
        contractorData.business_name,
        contractorData.business_name_ar,
        contractorData.business_type,
        contractorData.commercial_registration,
        contractorData.vat_number,
        contractorData.email,
        contractorData.phone,
        contractorData.whatsapp,
        contractorData.website,
        contractorData.address_line1,
        contractorData.address_line2,
        contractorData.city,
        contractorData.region,
        contractorData.postal_code,
        contractorData.established_year,
        contractorData.employee_count,
        contractorData.description,
        contractorData.description_ar,
        contractorData.service_categories,
        contractorData.service_areas,
        contractorData.years_experience,
        userId, // created_by
        requestMetadata.ip_address,
        requestMetadata.user_agent
      ];
      
      const result = await executeQuery(query, values, 'register_contractor');
      const contractor = this.mapDatabaseRowToContractor(result.rows[0]);
      
      // Log audit event
      auditLogger.contractorRegistration(contractorId, userId, {
        business_name: contractorData.business_name,
        business_type: contractorData.business_type,
        region: contractorData.region,
        city: contractorData.city,
        service_categories: contractorData.service_categories
      });
      
      // Create audit log entry
      await this.createAuditLog({
        contractor_id: contractorId,
        event_type: 'contractor_registration',
        event_description: 'New contractor profile created',
        event_data: {
          business_name: contractorData.business_name,
          business_type: contractorData.business_type,
          region: contractorData.region
        },
        performed_by: userId,
        performed_by_type: 'contractor',
        ip_address: requestMetadata.ip_address,
        user_agent: requestMetadata.user_agent,
        regulatory_impact: true
      });
      
      logger.info('Contractor registered successfully', {
        contractor_id: contractorId,
        user_id: userId,
        business_name: contractorData.business_name,
        region: contractorData.region
      });
      
      return contractor;
      
    } catch (error) {
      logger.error('Failed to register contractor', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        business_name: contractorData.business_name
      });
      throw error;
    }
  }
  
  /**
   * Get contractor by ID
   */
  async getContractorById(contractorId: string): Promise<ContractorProfile | null> {
    try {
      const query = `
        SELECT * FROM contractors 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await executeQuery(query, [contractorId], 'get_contractor_by_id');
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDatabaseRowToContractor(result.rows[0]);
      
    } catch (error) {
      logger.error('Failed to get contractor by ID', {
        contractor_id: contractorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Get contractor by user ID
   */
  async getContractorByUserId(userId: string): Promise<ContractorProfile | null> {
    try {
      const query = `
        SELECT * FROM contractors 
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      
      const result = await executeQuery(query, [userId], 'get_contractor_by_user_id');
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDatabaseRowToContractor(result.rows[0]);
      
    } catch (error) {
      logger.error('Failed to get contractor by user ID', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Search contractors with filters
   */
  async searchContractors(searchQuery: ContractorSearchQuery): Promise<ContractorSearchResult> {
    try {
      const {
        region,
        city,
        service_categories,
        status,
        min_rating,
        max_distance_km,
        verification_level,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = searchQuery;
      
      let whereConditions = ['deleted_at IS NULL'];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      // Build WHERE conditions
      if (region) {
        whereConditions.push(`region = $${paramIndex++}`);
        queryParams.push(region);
      }
      
      if (city) {
        whereConditions.push(`city = $${paramIndex++}`);
        queryParams.push(city);
      }
      
      if (service_categories && service_categories.length > 0) {
        whereConditions.push(`service_categories && $${paramIndex++}`);
        queryParams.push(service_categories);
      }
      
      if (status) {
        whereConditions.push(`status = $${paramIndex++}`);
        queryParams.push(status);
      }
      
      if (min_rating) {
        whereConditions.push(`average_rating >= $${paramIndex++}`);
        queryParams.push(min_rating);
      }
      
      if (verification_level !== undefined) {
        whereConditions.push(`verification_level >= $${paramIndex++}`);
        queryParams.push(verification_level);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Count query
      const countQuery = `
        SELECT COUNT(*) as total_count
        FROM contractors
        WHERE ${whereClause}
      `;
      
      const countResult = await executeQuery(countQuery, queryParams, 'count_contractors');
      const totalCount = parseInt(countResult.rows[0].total_count);
      
      // Main query with pagination
      const offset = (page - 1) * limit;
      const sortColumn = this.validateSortColumn(sort_by);
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      const mainQuery = `
        SELECT * FROM contractors
        WHERE ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      queryParams.push(limit, offset);
      
      const result = await executeQuery(mainQuery, queryParams, 'search_contractors');
      const contractors = result.rows.map(row => this.mapDatabaseRowToContractor(row));
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        contractors,
        total_count: totalCount,
        page,
        limit,
        total_pages: totalPages
      };
      
    } catch (error) {
      logger.error('Failed to search contractors', {
        search_query: searchQuery,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Update contractor status (Admin function)
   */
  async updateContractorStatus(
    contractorId: string,
    newStatus: ContractorStatus,
    adminId: string,
    notes?: string
  ): Promise<ContractorProfile> {
    try {
      // Get current contractor
      const currentContractor = await this.getContractorById(contractorId);
      if (!currentContractor) {
        throw new Error('Contractor not found');
      }
      
      const oldStatus = currentContractor.status;
      
      // Update status
      const query = `
        UPDATE contractors 
        SET status = $1, 
            admin_verified_at = $2,
            admin_verified_by = $3,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $4
        WHERE id = $5
        RETURNING *
      `;
      
      const values = [
        newStatus,
        newStatus === ContractorStatus.VERIFIED ? new Date() : null,
        newStatus === ContractorStatus.VERIFIED ? adminId : null,
        adminId,
        contractorId
      ];
      
      const result = await executeQuery(query, values, 'update_contractor_status');
      const updatedContractor = this.mapDatabaseRowToContractor(result.rows[0]);
      
      // Log audit events
      auditLogger.statusChange(contractorId, oldStatus, newStatus, adminId);
      
      await this.createAuditLog({
        contractor_id: contractorId,
        event_type: 'status_change',
        event_description: `Contractor status changed from ${oldStatus} to ${newStatus}`,
        event_data: {
          old_status: oldStatus,
          new_status: newStatus,
          notes
        },
        performed_by: adminId,
        performed_by_type: 'admin',
        regulatory_impact: true
      });
      
      logger.info('Contractor status updated', {
        contractor_id: contractorId,
        old_status: oldStatus,
        new_status: newStatus,
        admin_id: adminId
      });
      
      return updatedContractor;
      
    } catch (error) {
      logger.error('Failed to update contractor status', {
        contractor_id: contractorId,
        new_status: newStatus,
        admin_id: adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Get contractor dashboard statistics
   */
  async getContractorDashboardStats(contractorId: string): Promise<ContractorDashboardStats> {
    try {
      const contractor = await this.getContractorById(contractorId);
      if (!contractor) {
        throw new Error('Contractor not found');
      }
      
      // Calculate profile completion percentage
      const profileCompletion = this.calculateProfileCompletion(contractor);
      
      return {
        total_projects: contractor.total_projects,
        completed_projects: contractor.completed_projects,
        pending_projects: contractor.total_projects - contractor.completed_projects,
        average_rating: contractor.average_rating,
        total_reviews: contractor.total_reviews,
        response_time_hours: contractor.response_time_hours || 0,
        monthly_earnings: 0, // TODO: Implement earnings calculation
        profile_completion: profileCompletion,
        verification_status: contractor.status
      };
      
    } catch (error) {
      logger.error('Failed to get contractor dashboard stats', {
        contractor_id: contractorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
  
  /**
   * Create audit log entry
   */
  private async createAuditLog(logData: {
    contractor_id?: string;
    event_type: string;
    event_description: string;
    event_data?: Record<string, any>;
    performed_by?: string;
    performed_by_type: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    compliance_notes?: string;
    risk_assessment?: string;
    regulatory_impact?: boolean;
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO contractor_audit_logs (
          id, contractor_id, event_type, event_description, event_data,
          performed_by, performed_by_type, ip_address, user_agent,
          session_id, compliance_notes, risk_assessment, regulatory_impact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;
      
      const values = [
        uuidv4(),
        logData.contractor_id,
        logData.event_type,
        logData.event_description,
        JSON.stringify(logData.event_data || {}),
        logData.performed_by,
        logData.performed_by_type,
        logData.ip_address,
        logData.user_agent,
        logData.session_id,
        logData.compliance_notes,
        logData.risk_assessment,
        logData.regulatory_impact || false
      ];
      
      await executeQuery(query, values, 'create_audit_log');
      
    } catch (error) {
      logger.error('Failed to create audit log', {
        event_type: logData.event_type,
        contractor_id: logData.contractor_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw here to avoid breaking main operations
    }
  }
  
  /**
   * Update contractor profile
   * SAMA Compliant with audit logging
   */
  async updateContractorProfile(
    userId: string,
    updateData: Partial<ContractorProfile>,
    requestMetadata: { ip_address?: string; user_agent?: string }
  ): Promise<ContractorProfile> {
    try {
      // Get current contractor to ensure ownership
      const currentContractor = await this.getContractorByUserId(userId);
      if (!currentContractor) {
        throw new Error('Contractor profile not found');
      }

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      // Define allowed update fields that match database schema
      const allowedFields = [
        'business_name', 'business_name_ar', 'business_type', 'commercial_registration',
        'vat_number', 'email', 'phone', 'whatsapp', 'website', 'address_line1',
        'address_line2', 'city', 'region', 'postal_code', 'country',
        'established_year', 'employee_count', 'description', 'description_ar',
        'service_categories', 'service_areas', 'years_experience'
      ];

      // Build dynamic update statement
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        // No valid fields to update, return current contractor
        return currentContractor;
      }

      // Add metadata fields
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateFields.push(`updated_by = $${paramCount}`);
      values.push(userId);
      paramCount++;

      if (requestMetadata.ip_address) {
        updateFields.push(`ip_address = $${paramCount}`);
        values.push(requestMetadata.ip_address);
        paramCount++;
      }

      if (requestMetadata.user_agent) {
        updateFields.push(`user_agent = $${paramCount}`);
        values.push(requestMetadata.user_agent);
        paramCount++;
      }

      // Add WHERE clause parameter
      values.push(currentContractor.id);

      const query = `
        UPDATE contractors 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await executeQuery(query, values, 'update_contractor_profile');
      
      if (result.rows.length === 0) {
        throw new Error('Failed to update contractor profile');
      }

      const updatedContractor = this.mapDatabaseRowToContractor(result.rows[0]);

      // SAMA compliance audit log
      logger.info('Contractor profile updated', {
        contractor_id: currentContractor.id,
        updated_fields: Object.keys(updateData),
        business_name: updatedContractor.business_name,
        event_type: 'contractor_profile_updated',
        compliance_event: true,
        audit_trail: true,
        performed_by: userId,
        performed_by_type: 'contractor'
      });

      logger.info('Contractor profile updated successfully', {
        contractor_id: currentContractor.id,
        user_id: userId,
        updated_fields: Object.keys(updateData)
      });

      return updatedContractor;

    } catch (error) {
      logger.error('Failed to update contractor profile', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        update_fields: Object.keys(updateData)
      });
      throw error;
    }
  }

  /**
   * Map database row to ContractorProfile
   */
  private mapDatabaseRowToContractor(row: any): ContractorProfile {
    return {
      id: row.id,
      user_id: row.user_id,
      business_name: row.business_name,
      business_name_ar: row.business_name_ar,
      business_type: row.business_type as BusinessType,
      commercial_registration: row.commercial_registration,
      vat_number: row.vat_number,
      email: row.email,
      phone: row.phone,
      whatsapp: row.whatsapp,
      website: row.website,
      address_line1: row.address_line1,
      address_line2: row.address_line2,
      city: row.city,
      region: row.region,
      postal_code: row.postal_code,
      country: row.country,
      established_year: row.established_year,
      employee_count: row.employee_count,
      description: row.description,
      description_ar: row.description_ar,
      service_categories: row.service_categories as ServiceCategory[],
      service_areas: row.service_areas,
      years_experience: row.years_experience,
      status: row.status as ContractorStatus,
      verification_level: row.verification_level,
      admin_verified_at: row.admin_verified_at,
      admin_verified_by: row.admin_verified_by,
      total_projects: row.total_projects,
      completed_projects: row.completed_projects,
      average_rating: parseFloat(row.average_rating) || 0,
      total_reviews: row.total_reviews,
      response_time_hours: row.response_time_hours,
      bank_account_verified: row.bank_account_verified,
      tax_clearance_verified: row.tax_clearance_verified,
      financial_standing_verified: row.financial_standing_verified,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      ip_address: row.ip_address,
      user_agent: row.user_agent
    };
  }
  
  /**
   * Validate service categories
   */
  private validateServiceCategories(categories: ServiceCategory[]): void {
    const validCategories = Object.values(ServiceCategory);
    const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
    
    if (invalidCategories.length > 0) {
      throw new Error(`Invalid service categories: ${invalidCategories.join(', ')}`);
    }
  }
  
  /**
   * Validate sort column for search
   */
  private validateSortColumn(sortBy: string): string {
    const allowedColumns = [
      'created_at', 'updated_at', 'business_name', 'average_rating',
      'total_reviews', 'verification_level', 'years_experience'
    ];
    
    if (!allowedColumns.includes(sortBy)) {
      return 'created_at'; // Default fallback
    }
    
    return sortBy;
  }
  
  /**
   * Calculate profile completion percentage
   */
  private calculateProfileCompletion(contractor: ContractorProfile): number {
    let completedFields = 0;
    let totalFields = 0;
    
    // Required fields
    const requiredFields = [
      'business_name', 'business_type', 'email', 'phone',
      'address_line1', 'city', 'region', 'service_categories'
    ];
    
    // Optional fields that boost completion
    const optionalFields = [
      'business_name_ar', 'commercial_registration', 'vat_number',
      'website', 'description', 'description_ar', 'established_year',
      'employee_count', 'years_experience'
    ];
    
    // Check required fields
    requiredFields.forEach(field => {
      totalFields++;
      if (contractor[field as keyof ContractorProfile]) {
        completedFields++;
      }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      totalFields++;
      if (contractor[field as keyof ContractorProfile]) {
        completedFields++;
      }
    });
    
    return Math.round((completedFields / totalFields) * 100);
  }
}