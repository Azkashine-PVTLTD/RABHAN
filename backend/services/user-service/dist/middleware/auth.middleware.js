"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
// Use shared JWT secret (same as auth service)
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        console.log('🔐 Auth middleware - checking token...');
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No auth header provided');
            throw new types_1.UnauthorizedError('No authentication token provided');
        }
        const token = authHeader.substring(7);
        console.log('🔑 Token received, verifying...');
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {
            algorithms: ['HS256'],
            issuer: 'rabhan-auth-service',
            audience: 'rabhan-platform'
        });
        console.log('✅ Token verified successfully:', { userId: decoded.sub || decoded.userId, email: decoded.email, role: decoded.role });
        // Add user info to request
        req.user = {
            id: decoded.sub || decoded.userId,
            email: decoded.email,
            role: decoded.role,
            nationalId: decoded.nationalId
        };
        console.log('👤 User set on request:', req.user);
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            next(new types_1.UnauthorizedError('Token expired'));
        }
        else if (error.name === 'JsonWebTokenError') {
            next(new types_1.UnauthorizedError('Invalid token'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
// Check if user has required role
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new types_1.UnauthorizedError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Optional authentication (for public endpoints that may benefit from auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            return next();
        }
        const token = authHeader.substring(7);
        // Try to verify token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {
                algorithms: ['HS256'],
                issuer: 'rabhan-auth-service',
                audience: 'rabhan-platform'
            });
            req.user = {
                id: decoded.sub || decoded.userId,
                email: decoded.email,
                role: decoded.role,
                nationalId: decoded.nationalId
            };
        }
        catch (error) {
            // Invalid token, continue without authentication
            logger_1.logger.debug('Optional auth: Invalid token provided', { error });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map