import axios, { AxiosResponse } from 'axios';

// Get API base URL from environment config
const API_BASE_URL = 'http://localhost';

// Document Types & Interfaces
export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required_for_kyc: boolean;
  user_type: 'USER' | 'CONTRACTOR' | 'BOTH';
  validation_rules: any;
}

export interface DocumentMetadata {
  document_id: string;
  user_id: string;
  category_id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  file_hash: string;
  upload_timestamp: string;
  validation_score: number;
  virus_scan_status: 'pending' | 'scanning' | 'clean' | 'infected' | 'suspicious' | 'error';
  approval_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  document_status: 'pending' | 'processing' | 'validated' | 'approved' | 'rejected' | 'expired' | 'archived';
  ocr_confidence: number;
  extracted_data?: any;
  sama_audit_log: any[];
  category?: DocumentCategory;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'virus_scanning' | 'validating' | 'processing' | 'complete';
  message: string;
}

export interface UploadResponse {
  success: boolean;
  document_id: string;
  message: string;
  validation_results?: ValidationResults;
  extracted_data?: any;
}

export interface ValidationResults {
  overall_score: number;
  file_validation: {
    valid: boolean;
    issues: string[];
  };
  virus_scan: {
    status: string;
    clean: boolean;
    threats?: string[];
  };
  content_validation: {
    valid: boolean;
    confidence: number;
    issues: string[];
  };
  security_validation: {
    valid: boolean;
    risk_level: 'low' | 'medium' | 'high';
    issues: string[];
  };
}

export interface DocumentFilters {
  category_id?: string;
  status?: string;
  approval_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentListResponse {
  documents: DocumentMetadata[];
  total_count: number;
  filtered_count: number;
  page: number;
  limit: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    storage: boolean;
    virus_scanner: boolean;
    ocr_service: boolean;
  };
  last_check: string;
}

class DocumentService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = `${API_BASE_URL}:3003/api/documents`;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Get user ID from token or generate a valid UUID for development
  private getUserIdFromToken(): string | null {
    if (!this.authToken) {
      // Use a valid UUID for testing
      return '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0';
    }
    
    try {
      // Decode JWT token to extract user ID
      const base64Url = this.authToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      return payload.userId || '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0';
    } catch (error) {
      console.error('Failed to decode token:', error);
      return '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0';
    }
  }

  // Get authorization headers
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Get multipart headers for file upload
  private getMultipartHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken || 'test-token'}`,
      // Don't set Content-Type for multipart/form-data - let axios handle it
    };
  }

  // Upload document with progress tracking
  async uploadDocument(
    file: File, 
    categoryId: string, 
    metadata?: any,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      // Get userId from auth token or use a test user ID for development
      const userId = this.getUserIdFromToken() || 'test-user-id';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', categoryId); // Fixed field name
      formData.append('userId', userId); // Added missing userId field
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response: AxiosResponse<UploadResponse> = await axios.post(
        `${this.baseURL}/upload`,
        formData,
        {
          headers: this.getMultipartHeaders(),
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
                stage: percentage < 100 ? 'uploading' : 'virus_scanning',
                message: percentage < 100 ? 'Uploading file...' : 'Scanning for viruses...'
              });
            }
          },
          timeout: 300000 // 5 minutes timeout for large files
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Document upload failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Upload failed';
      throw new Error(errorMessage);
    }
  }

  // Get list of user documents
  async getDocuments(filters?: DocumentFilters): Promise<DocumentListResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add userId to query parameters
      const userId = this.getUserIdFromToken();
      if (userId) {
        params.append('userId', userId);
      }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response: AxiosResponse<DocumentListResponse> = await axios.get(
        `${this.baseURL}/?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch documents');
    }
  }

  // Get specific document details
  async getDocument(documentId: string): Promise<DocumentMetadata> {
    try {
      const response: AxiosResponse<DocumentMetadata> = await axios.get(
        `${this.baseURL}/${documentId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch document:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch document');
    }
  }

  // Download document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await axios.get(
        `${this.baseURL}/${documentId}/download`,
        { 
          headers: this.getAuthHeaders(),
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to download document:', error);
      throw new Error(error.response?.data?.message || 'Failed to download document');
    }
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const userId = this.getUserIdFromToken();
      console.log('Deleting document:', { documentId, userId, baseURL: this.baseURL });
      
      const response = await axios.delete(
        `${this.baseURL}/${documentId}?userId=${encodeURIComponent(userId || '')}`,
        { 
          headers: this.getAuthHeaders()
        }
      );

      console.log('Delete response:', response.data);
      return true;
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete document');
    }
  }

  // Get document categories
  async getCategories(): Promise<DocumentCategory[]> {
    try {
      const response: AxiosResponse<{ categories: DocumentCategory[] }> = await axios.get(
        `${this.baseURL}/categories/list`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.categories;
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  // Get service health status
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response: AxiosResponse<HealthStatus> = await axios.get(
        `${this.baseURL}/health/status`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to get health status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get health status');
    }
  }

  // Poll document status for real-time updates
  async pollDocumentStatus(
    documentId: string, 
    onStatusUpdate: (document: DocumentMetadata) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<void> {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const document = await this.getDocument(documentId);
        onStatusUpdate(document);
        
        // Stop polling if processing is complete
        if (document.document_status === 'validated' || 
            document.document_status === 'approved' ||
            document.document_status === 'rejected' ||
            document.virus_scan_status === 'infected' ||
            attempts >= maxAttempts) {
          return;
        }
        
        attempts++;
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Error polling document status:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, intervalMs);
        }
      }
    };
    
    poll();
  }

  // Helper method to format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get status color
  static getStatusColor(status: string): string {
    const colors = {
      'pending': '#f59e0b',
      'processing': '#3b82f6',
      'validated': '#10b981',
      'approved': '#059669',
      'rejected': '#ef4444',
      'expired': '#6b7280',
      'archived': '#9ca3af',
      'clean': '#10b981',
      'infected': '#ef4444',
      'suspicious': '#f59e0b',
      'under_review': '#8b5cf6'
    };
    
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  // Helper method to get user-friendly status text
  static getStatusText(status: string, language: string = 'en'): string {
    const statusTexts = {
      en: {
        'pending': 'Pending',
        'processing': 'Processing',
        'validated': 'Validated',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'expired': 'Expired',
        'archived': 'Archived',
        'clean': 'Virus-free',
        'infected': 'Virus detected',
        'suspicious': 'Suspicious',
        'under_review': 'Under review',
        'scanning': 'Scanning...'
      },
      ar: {
        'pending': 'في الانتظار',
        'processing': 'قيد المعالجة',
        'validated': 'تم التحقق',
        'approved': 'موافق عليه',
        'rejected': 'مرفوض',
        'expired': 'منتهي الصلاحية',
        'archived': 'مؤرشف',
        'clean': 'خالي من الفيروسات',
        'infected': 'تم اكتشاف فيروس',
        'suspicious': 'مشبوه',
        'under_review': 'قيد المراجعة',
        'scanning': 'جاري الفحص...'
      }
    };
    
    return statusTexts[language as keyof typeof statusTexts]?.[status as keyof typeof statusTexts.en] || status;
  }
}

// Export singleton instance and class
export const documentService = new DocumentService();
export { DocumentService };
export default DocumentService;