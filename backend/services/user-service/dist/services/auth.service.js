"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
class AuthService {
    client;
    constructor() {
        const baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const timeout = parseInt(process.env.AUTH_SERVICE_TIMEOUT || '5000', 10);
        this.client = axios_1.default.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Name': 'user-service',
                'X-Service-Version': process.env.SERVICE_VERSION || '1.0.0'
            }
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug('Auth service request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Auth service request error', error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            return response;
        }, (error) => {
            if (error.response) {
                logger_1.logger.error('Auth service response error', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            else if (error.request) {
                logger_1.logger.error('Auth service no response', {
                    message: 'No response from auth service'
                });
            }
            else {
                logger_1.logger.error('Auth service error', error);
            }
            return Promise.reject(error);
        });
    }
    // Verify user exists and token is valid
    async verifyUser(userId, authToken) {
        try {
            const response = await this.client.get(`/api/auth/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const user = response.data.data;
            // Validate user status
            if (user.status !== 'ACTIVE') {
                throw new types_1.UnauthorizedError('User account is not active');
            }
            // For BNPL, user must have verified phone
            if (!user.phoneVerified) {
                throw new types_1.UnauthorizedError('Phone verification required');
            }
            return user;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            if (error.response?.status === 401) {
                throw new types_1.UnauthorizedError('Invalid authentication token');
            }
            throw error;
        }
    }
    // Validate JWT token
    async validateToken(token) {
        try {
            const response = await this.client.post('/api/auth/validate', {
                token
            });
            return response.data.data;
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new types_1.UnauthorizedError('Invalid or expired token');
            }
            throw error;
        }
    }
    // Get user by national ID (for admin operations)
    async getUserByNationalId(nationalId, adminToken) {
        try {
            const response = await this.client.get('/api/auth/users/by-national-id', {
                params: { nationalId },
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            return response.data.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }
    // Check if service is healthy
    async isHealthy() {
        try {
            const response = await this.client.get('/health', {
                timeout: 2000
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map