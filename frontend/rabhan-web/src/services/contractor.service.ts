import { api } from './api.service';

export interface ContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_name_ar?: string;
  business_type: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'MEDIUM_BUSINESS' | 'LARGE_BUSINESS' | 'FULL_CONTRACTOR';
  commercial_registration?: string;
  vat_number?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  established_year?: number;
  employee_count?: number;
  description?: string;
  description_ar?: string;
  service_categories: string[];
  service_areas: string[];
  years_experience: number;
  verification_level: number;
  average_rating: number;
  total_reviews: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorRegistrationData {
  business_name: string;
  business_name_ar?: string;
  business_type: string;
  commercial_registration?: string;
  vat_number?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  established_year?: number;
  employee_count?: number;
  description?: string;
  description_ar?: string;
  service_categories: string[];
  service_areas: string[];
  years_experience: number;
}

export interface ContractorDashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_revenue: number;
  this_month_revenue: number;
  average_rating: number;
  total_reviews: number;
  verification_level: number;
  profile_completion: number;
}

class ContractorService {
  private baseURL = process.env.REACT_APP_CONTRACTOR_SERVICE_URL || 'http://localhost:3006/api/contractors';

  /**
   * Register a new contractor
   */
  async registerContractor(data: ContractorRegistrationData): Promise<ContractorProfile> {
    try {
      const response = await api.post(`${this.baseURL}/register`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error registering contractor:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to register contractor');
    }
  }

  /**
   * Get current user's contractor profile
   */
  async getProfile(): Promise<ContractorProfile> {
    try {
      const response = await api.get(`${this.baseURL}/profile`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting contractor profile:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get contractor profile');
    }
  }

  /**
   * Get contractor dashboard statistics
   */
  async getDashboardStats(): Promise<ContractorDashboardStats> {
    try {
      const response = await api.get(`${this.baseURL}/dashboard/stats`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get dashboard statistics');
    }
  }

  /**
   * Search contractors
   */
  async searchContractors(query: {
    region?: string;
    city?: string;
    service_categories?: string[];
    status?: string;
    min_rating?: number;
    max_distance_km?: number;
    verification_level?: number;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{ contractors: ContractorProfile[]; total: number; page: number; totalPages: number }> {
    try {
      // Convert array parameters to comma-separated strings
      const params: any = { ...query };
      if (params.service_categories && Array.isArray(params.service_categories)) {
        params.service_categories = params.service_categories.join(',');
      }

      const response = await api.get(`${this.baseURL}/search`, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching contractors:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to search contractors');
    }
  }

  /**
   * Get contractor by ID
   */
  async getContractorById(id: string): Promise<ContractorProfile> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting contractor by ID:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get contractor');
    }
  }

  /**
   * Update contractor profile
   * Makes API call to backend contractor service
   * If contractor doesn't exist, tries to register them first
   */
  async updateProfile(userId: string, section: string, data: any): Promise<{ success: boolean }> {
    try {
      console.log(`💾 Saving contractor ${section} data for user ${userId}:`, data);
      
      // Make actual API call to backend
      const response = await api.put(`${this.baseURL}/profile`, data);
      
      console.log(`✅ Successfully saved ${section} data via API:`, response.data);
      
      // Also store in localStorage as backup
      const storageKey = `contractor_${userId}_${section}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      return { success: true };
      
    } catch (error: any) {
      console.error(`Error updating contractor ${section}:`, error);
      
      // If 404 error (contractor doesn't exist), try to register first
      if (error.response?.status === 404 || error.response?.data?.error?.code === 'ROUTE_NOT_FOUND') {
        console.log(`🔄 Contractor profile not found. Attempting to register first...`);
        
        try {
          // Create minimal contractor registration with the data we have
          const registrationData = this.prepareRegistrationData(data, section);
          
          if (registrationData) {
            console.log(`📝 Registering contractor with data:`, registrationData);
            await this.registerContractor(registrationData);
            
            // Now retry the update
            console.log(`🔄 Retrying profile update after registration...`);
            const retryResponse = await api.put(`${this.baseURL}/profile`, data);
            
            console.log(`✅ Successfully saved ${section} data after registration:`, retryResponse.data);
            
            // Store in localStorage as backup
            const storageKey = `contractor_${userId}_${section}`;
            localStorage.setItem(storageKey, JSON.stringify(data));
            
            return { success: true };
          }
        } catch (registrationError) {
          console.error('Failed to register contractor:', registrationError);
          // Fall through to original error handling
        }
      }
      
      // If API fails, still store locally as fallback
      const storageKey = `contractor_${userId}_${section}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      throw new Error(`Failed to update ${section}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Prepare registration data from profile update data
   */
  private prepareRegistrationData(data: any, section: string): ContractorRegistrationData | null {
    // We need minimum required fields for registration
    // This is a basic implementation - in a real app you'd want a proper registration flow
    
    // Try to get user ID from auth service
    let userId = 'temp';
    try {
      const authService = (window as any).authService;
      const user = authService?.getCurrentUser();
      userId = user?.id || 'temp';
    } catch (error) {
      console.warn('Could not get current user for loading saved data');
    }
    
    const savedData = this.loadAllSavedData(userId); // Load any previously saved data
    
    const registrationData: any = {
      business_name: data.business_name || savedData.business?.business_name || 'My Business',
      business_type: data.business_type || savedData.business?.business_type || 'INDIVIDUAL',
      email: data.email || savedData.contact?.email || 'contractor@example.com',
      phone: data.phone || savedData.contact?.phone || '+966500000000',
      address_line1: data.address_line1 || savedData.address?.address_line1 || 'Address',
      city: data.city || savedData.address?.city || 'Riyadh',
      region: data.region || savedData.address?.region || 'Riyadh Region',
      service_categories: data.service_categories || savedData.services?.service_categories || ['SOLAR_INSTALLATION'],
      service_areas: data.service_areas || savedData.services?.service_areas || ['Riyadh'],
      years_experience: data.years_experience || savedData.services?.years_experience || 1
    };

    // Only proceed if we have the minimum required fields
    if (registrationData.business_name && registrationData.email && registrationData.phone) {
      return registrationData as ContractorRegistrationData;
    }
    
    console.warn('Insufficient data for contractor registration');
    return null;
  }

  /**
   * Load saved contractor data from localStorage
   */
  loadSavedData(userId: string, section: string): any | null {
    try {
      const storageKey = `contractor_${userId}_${section}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        return JSON.parse(savedData);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to load saved data for ${section}:`, error);
      return null;
    }
  }

  /**
   * Load all saved contractor data for a user
   */
  loadAllSavedData(userId: string): { [section: string]: any } {
    const sections = ['business', 'contact', 'address', 'services', 'verification', 'financial', 'preferences'];
    const savedData: { [section: string]: any } = {};
    
    sections.forEach(section => {
      const sectionData = this.loadSavedData(userId, section);
      if (sectionData) {
        savedData[section] = sectionData;
      }
    });
    
    return savedData;
  }

  /**
   * Clear saved data for a user
   */
  clearSavedData(userId: string): void {
    const sections = ['business', 'contact', 'address', 'services', 'verification', 'financial', 'preferences'];
    sections.forEach(section => {
      const storageKey = `contractor_${userId}_${section}`;
      localStorage.removeItem(storageKey);
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await api.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking contractor service health:', error);
      throw new Error('Contractor service is unavailable');
    }
  }
}

export const contractorService = new ContractorService();
export default contractorService;