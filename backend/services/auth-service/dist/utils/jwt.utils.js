"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ms_1 = __importDefault(require("ms"));
const environment_config_1 = require("../config/environment.config");
class JWTUtils {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, environment_config_1.config.jwt.secret, {
            expiresIn: environment_config_1.config.jwt.accessTokenExpiresIn,
            issuer: 'rabhan-auth-service',
            audience: 'rabhan-platform'
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, environment_config_1.config.jwt.refreshSecret, {
            expiresIn: environment_config_1.config.jwt.refreshTokenExpiresIn,
            issuer: 'rabhan-auth-service',
            audience: 'rabhan-platform'
        });
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, environment_config_1.config.jwt.secret, {
                issuer: 'rabhan-auth-service',
                audience: 'rabhan-platform'
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            throw error;
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, environment_config_1.config.jwt.refreshSecret, {
                issuer: 'rabhan-auth-service',
                audience: 'rabhan-platform'
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch {
            return null;
        }
    }
    static getExpiresInMs(expiresIn) {
        return (0, ms_1.default)(expiresIn);
    }
    static generateTokenPair(userId, email, role, sessionId) {
        const payload = {
            userId,
            email,
            role,
            sessionId
        };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        const expiresIn = this.getExpiresInMs(environment_config_1.config.jwt.accessTokenExpiresIn);
        return {
            accessToken,
            refreshToken,
            expiresIn
        };
    }
    static isTokenExpiringSoon(token, thresholdMs = 5 * 60 * 1000) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp)
                return true;
            const expirationTime = decoded.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiry = expirationTime - currentTime;
            return timeUntilExpiry <= thresholdMs;
        }
        catch {
            return true;
        }
    }
}
exports.JWTUtils = JWTUtils;
//# sourceMappingURL=jwt.utils.js.map