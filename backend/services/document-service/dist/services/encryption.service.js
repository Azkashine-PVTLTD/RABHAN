"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const environment_config_1 = require("../config/environment.config");
const logger_1 = require("../utils/logger");
class EncryptionService {
    static instance;
    algorithm;
    keyLength;
    ivLength;
    tagLength;
    masterKey;
    constructor() {
        this.algorithm = environment_config_1.config.encryption.algorithm;
        this.keyLength = environment_config_1.config.encryption.keyLength;
        this.ivLength = environment_config_1.config.encryption.ivLength;
        this.tagLength = environment_config_1.config.encryption.tagLength;
        this.masterKey = Buffer.from(environment_config_1.config.encryption.masterKey, 'hex');
        this.validateConfiguration();
    }
    static getInstance() {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }
    validateConfiguration() {
        if (this.masterKey.length !== this.keyLength) {
            throw new Error(`Master key must be ${this.keyLength} bytes long`);
        }
        if (!['aes-256-gcm', 'aes-256-cbc'].includes(this.algorithm)) {
            throw new Error(`Unsupported encryption algorithm: ${this.algorithm}`);
        }
        logger_1.logger.info('Encryption service initialized', {
            algorithm: this.algorithm,
            keyLength: this.keyLength,
            ivLength: this.ivLength,
            tagLength: this.tagLength,
        });
    }
    async encryptBuffer(buffer, documentId, userId, additionalData) {
        try {
            const startTime = Date.now();
            const documentKey = await this.generateDocumentKey(documentId, userId);
            const keyId = this.generateKeyId(documentId, userId);
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const cipher = crypto_1.default.createCipheriv(this.algorithm, documentKey, iv);
            const encrypted = Buffer.concat([
                cipher.update(buffer),
                cipher.final()
            ]);
            const authTag = Buffer.alloc(0);
            const encryptedBuffer = Buffer.concat([iv, authTag, encrypted]);
            const encryptionTime = Date.now() - startTime;
            logger_1.SAMALogger.logComplianceEvent('ENCRYPTION_KEY_ROTATION', 'CSF-3.3.9-CRYPTOGRAPHY', {
                documentId,
                userId,
                keyId,
                algorithm: this.algorithm,
                encryptionTime,
                bufferSize: buffer.length,
                encryptedSize: encryptedBuffer.length,
            });
            logger_1.logger.debug('Buffer encrypted successfully', {
                documentId,
                userId,
                keyId,
                originalSize: buffer.length,
                encryptedSize: encryptedBuffer.length,
                encryptionTime,
            });
            return {
                encryptedBuffer,
                keyId,
                encryptionMetadata: {
                    algorithm: this.algorithm,
                    keyLength: this.keyLength,
                    ivLength: this.ivLength,
                    tagLength: this.tagLength,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Buffer encryption failed:', {
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            logger_1.SAMALogger.logSecurityEvent('ENCRYPTION_FAILURE', 'HIGH', {
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                algorithm: this.algorithm,
            });
            throw new Error('Encryption failed');
        }
    }
    async decryptBuffer(encryptedBuffer, keyId, documentId, userId, additionalData) {
        try {
            const startTime = Date.now();
            const documentKey = await this.regenerateDocumentKey(keyId, documentId, userId);
            const iv = encryptedBuffer.slice(0, this.ivLength);
            const authTag = this.algorithm.includes('gcm')
                ? encryptedBuffer.slice(this.ivLength, this.ivLength + this.tagLength)
                : Buffer.alloc(0);
            const encrypted = encryptedBuffer.slice(this.ivLength + (this.algorithm.includes('gcm') ? this.tagLength : 0));
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, documentKey, iv);
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            const decryptionTime = Date.now() - startTime;
            logger_1.logger.debug('Buffer decrypted successfully', {
                documentId,
                userId,
                keyId,
                encryptedSize: encryptedBuffer.length,
                decryptedSize: decrypted.length,
                decryptionTime,
            });
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Buffer decryption failed:', {
                documentId,
                userId,
                keyId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            logger_1.SAMALogger.logSecurityEvent('ENCRYPTION_FAILURE', 'HIGH', {
                documentId,
                userId,
                keyId,
                operation: 'decrypt',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Decryption failed');
        }
    }
    async generateDocumentKey(documentId, userId) {
        const keyMaterial = `${documentId}:${userId}:${Date.now()}`;
        return crypto_1.default.pbkdf2Sync(keyMaterial, this.masterKey, 100000, this.keyLength, 'sha256');
    }
    async regenerateDocumentKey(keyId, documentId, userId) {
        const keyMaterial = `${documentId}:${userId}:${keyId}`;
        return crypto_1.default.pbkdf2Sync(keyMaterial, this.masterKey, 100000, this.keyLength, 'sha256');
    }
    generateKeyId(documentId, userId) {
        const timestamp = Date.now().toString();
        const hash = crypto_1.default.createHash('sha256')
            .update(`${documentId}:${userId}:${timestamp}`)
            .digest('hex');
        return `key_${hash.substring(0, 16)}`;
    }
    generateFileHash(buffer) {
        return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
    }
    verifyFileIntegrity(buffer, expectedHash) {
        const actualHash = this.generateFileHash(buffer);
        return actualHash === expectedHash;
    }
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    async hashPassword(password) {
        const saltRounds = 12;
        const bcrypt = require('bcrypt');
        return bcrypt.hash(password, saltRounds);
    }
    async verifyPassword(password, hash) {
        const bcrypt = require('bcrypt');
        return bcrypt.compare(password, hash);
    }
    encryptMetadata(metadata) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-cbc', this.masterKey, iv);
        let encrypted = cipher.update(JSON.stringify(metadata), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decryptMetadata(encryptedMetadata) {
        const [ivHex, encrypted] = encryptedMetadata.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', this.masterKey, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
    generateHMAC(data, secret) {
        return crypto_1.default.createHmac('sha256', secret).update(data).digest('hex');
    }
    verifyHMAC(data, signature, secret) {
        const expectedSignature = this.generateHMAC(data, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    generateOneTimePad(length) {
        const pad = crypto_1.default.randomBytes(length);
        const padId = this.generateSecureToken(16);
        return {
            pad,
            padId,
        };
    }
    encryptWithOneTimePad(data, pad) {
        if (data.length !== pad.length) {
            throw new Error('Data and pad must be the same length');
        }
        const encrypted = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            encrypted[i] = data[i] ^ pad[i];
        }
        return encrypted;
    }
    decryptWithOneTimePad(encryptedData, pad) {
        return this.encryptWithOneTimePad(encryptedData, pad);
    }
    generateVersionKey(documentId, version) {
        const versionMaterial = `${documentId}:version:${version}`;
        return crypto_1.default.pbkdf2Sync(versionMaterial, this.masterKey, 100000, this.keyLength, 'sha256');
    }
    secureWipe(buffer) {
        crypto_1.default.randomFillSync(buffer);
    }
    getHealthStatus() {
        try {
            const testData = Buffer.from('test data for health check');
            const testIv = crypto_1.default.randomBytes(this.ivLength);
            const encrypted = crypto_1.default.createCipheriv(this.algorithm, this.masterKey, testIv);
            encrypted.update(testData);
            encrypted.final();
            return {
                status: 'healthy',
                details: {
                    algorithm: this.algorithm,
                    keyLength: this.keyLength,
                    masterKeyConfigured: this.masterKey.length === this.keyLength,
                    cryptoSupport: true,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Encryption service health check failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                status: 'unhealthy',
                details: {
                    algorithm: this.algorithm,
                    keyLength: this.keyLength,
                    masterKeyConfigured: false,
                    cryptoSupport: false,
                },
            };
        }
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryption.service.js.map