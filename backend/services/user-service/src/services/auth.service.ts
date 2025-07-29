import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { UnauthorizedError } from '../types';

interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  nationalId?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  samaVerified: boolean;
}

export class AuthService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    const timeout = parseInt(process.env.AUTH_SERVICE_TIMEOUT || '5000', 10);

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'user-service',
        'X-Service-Version': process.env.SERVICE_VERSION || '1.0.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Auth service request', {
          method: config.method,
          url: config.url
        });
        return config;
      },
      (error) => {
        logger.error('Auth service request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error('Auth service response error', {
            status: error.response.status,
            data: error.response.data
          });
        } else if (error.request) {
          logger.error('Auth service no response', {
            message: 'No response from auth service'
          });
        } else {
          logger.error('Auth service error', error);
        }
        return Promise.reject(error);
      }
    );
  }

  // Verify user exists and token is valid
  async verifyUser(userId: string, authToken: string): Promise<AuthUser | null> {
    try {
      const response = await this.client.get(`/api/auth/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const user = response.data.data;

      // Validate user status
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('User account is not active');
      }

      // For BNPL, user must have verified phone
      if (!user.phoneVerified) {
        throw new UnauthorizedError('Phone verification required');
      }

      return user;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      if (error.response?.status === 401) {
        throw new UnauthorizedError('Invalid authentication token');
      }
      throw error;
    }
  }

  // Validate JWT token
  async validateToken(token: string): Promise<any> {
    try {
      const response = await this.client.post('/api/auth/validate', {
        token
      });

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      throw error;
    }
  }

  // Get user by national ID (for admin operations)
  async getUserByNationalId(nationalId: string, adminToken: string): Promise<AuthUser | null> {
    try {
      const response = await this.client.get('/api/auth/users/by-national-id', {
        params: { nationalId },
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Check if service is healthy
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 2000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}