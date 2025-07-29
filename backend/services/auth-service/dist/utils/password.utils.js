"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtils = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const environment_config_1 = require("../config/environment.config");
class PasswordUtils {
    static MIN_PASSWORD_LENGTH = 8;
    static PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    static async hash(password) {
        return bcrypt_1.default.hash(password, environment_config_1.config.security.bcryptRounds);
    }
    static async compare(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    static validate(password) {
        const errors = [];
        if (password.length < this.MIN_PASSWORD_LENGTH) {
            errors.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
        }
        if (!this.PASSWORD_REGEX.test(password)) {
            errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }
        if (password.includes(' ')) {
            errors.push('Password cannot contain spaces');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        const randomValues = new Uint8Array(length);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(randomValues);
        }
        else {
            for (let i = 0; i < length; i++) {
                randomValues[i] = Math.floor(Math.random() * 256);
            }
        }
        for (let i = 0; i < length; i++) {
            token += chars[(randomValues[i] || 0) % chars.length];
        }
        return token;
    }
    static checkPasswordStrength(password) {
        let score = 0;
        const suggestions = [];
        if (password.length >= 8)
            score++;
        if (password.length >= 12)
            score++;
        if (password.length >= 16)
            score++;
        else
            suggestions.push('Use at least 16 characters for better security');
        if (/[a-z]/.test(password))
            score++;
        else
            suggestions.push('Add lowercase letters');
        if (/[A-Z]/.test(password))
            score++;
        else
            suggestions.push('Add uppercase letters');
        if (/\d/.test(password))
            score++;
        else
            suggestions.push('Add numbers');
        if (/[@$!%*?&]/.test(password))
            score++;
        else
            suggestions.push('Add special characters');
        if (!/(.)\1{2,}/.test(password))
            score++;
        else
            suggestions.push('Avoid repeated characters');
        const strengthMap = {
            0: 'weak',
            1: 'weak',
            2: 'weak',
            3: 'fair',
            4: 'fair',
            5: 'good',
            6: 'good',
            7: 'strong',
            8: 'very-strong'
        };
        return {
            score,
            strength: strengthMap[score] || 'weak',
            suggestions
        };
    }
}
exports.PasswordUtils = PasswordUtils;
//# sourceMappingURL=password.utils.js.map