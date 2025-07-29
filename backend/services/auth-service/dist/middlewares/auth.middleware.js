"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../utils/logger");
class AuthMiddleware {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    authenticate = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                logger_1.SAMALogger.logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', 'LOW', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path
                });
                res.status(401).json({ error: 'Access token required' });
                return;
            }
            const token = authHeader.substring(7);
            // Verify token
            const payload = jwt_utils_1.JWTUtils.verifyAccessToken(token);
            // Get user details
            const user = await this.authService.getUserById(payload.userId);
            if (!user) {
                logger_1.SAMALogger.logSecurityEvent('INVALID_USER_TOKEN', 'MEDIUM', {
                    userId: payload.userId,
                    sessionId: payload.sessionId
                });
                res.status(401).json({ error: 'Invalid user' });
                return;
            }
            // Check if user is active
            if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
                logger_1.SAMALogger.logSecurityEvent('INACTIVE_USER_ACCESS', 'MEDIUM', {
                    userId: user.id,
                    status: user.status
                });
                res.status(403).json({ error: 'Account is not active' });
                return;
            }
            // Add user to request
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                sessionId: payload.sessionId
            };
            next();
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    res.status(401).json({ error: 'Token expired' });
                }
                else if (error.message.includes('invalid')) {
                    res.status(401).json({ error: 'Invalid token' });
                }
                else {
                    logger_1.SAMALogger.logSecurityEvent('AUTH_MIDDLEWARE_ERROR', 'HIGH', { error: error.message });
                    res.status(500).json({ error: 'Authentication error' });
                }
            }
            else {
                res.status(500).json({ error: 'Authentication error' });
            }
        }
    };
    authorize = (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            if (!roles.includes(req.user.role)) {
                logger_1.SAMALogger.logSecurityEvent('UNAUTHORIZED_ROLE_ACCESS', 'MEDIUM', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: roles,
                    path: req.path
                });
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }
            next();
        };
    };
    optional = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }
            const token = authHeader.substring(7);
            try {
                const payload = jwt_utils_1.JWTUtils.verifyAccessToken(token);
                const user = await this.authService.getUserById(payload.userId);
                if (user && (user.status === 'ACTIVE' || user.status === 'PENDING')) {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        sessionId: payload.sessionId
                    };
                }
            }
            catch (error) {
                // Ignore token errors for optional authentication
            }
            next();
        }
        catch (error) {
            // Ignore errors for optional authentication
            next();
        }
    };
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map