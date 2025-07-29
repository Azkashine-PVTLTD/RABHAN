export declare class EncryptionService {
    private static instance;
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private readonly masterKey;
    private constructor();
    static getInstance(): EncryptionService;
    private validateConfiguration;
    encryptBuffer(buffer: Buffer, documentId: string, userId: string, additionalData?: Buffer): Promise<{
        encryptedBuffer: Buffer;
        keyId: string;
        encryptionMetadata: {
            algorithm: string;
            keyLength: number;
            ivLength: number;
            tagLength: number;
            timestamp: string;
        };
    }>;
    decryptBuffer(encryptedBuffer: Buffer, keyId: string, documentId: string, userId: string, additionalData?: Buffer): Promise<Buffer>;
    private generateDocumentKey;
    private regenerateDocumentKey;
    private generateKeyId;
    generateFileHash(buffer: Buffer): string;
    verifyFileIntegrity(buffer: Buffer, expectedHash: string): boolean;
    generateSecureToken(length?: number): string;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    encryptMetadata(metadata: any): string;
    decryptMetadata(encryptedMetadata: string): any;
    generateHMAC(data: string, secret: string): string;
    verifyHMAC(data: string, signature: string, secret: string): boolean;
    generateOneTimePad(length: number): {
        pad: Buffer;
        padId: string;
    };
    encryptWithOneTimePad(data: Buffer, pad: Buffer): Buffer;
    decryptWithOneTimePad(encryptedData: Buffer, pad: Buffer): Buffer;
    generateVersionKey(documentId: string, version: number): Buffer;
    secureWipe(buffer: Buffer): void;
    getHealthStatus(): {
        status: 'healthy' | 'unhealthy';
        details: {
            algorithm: string;
            keyLength: number;
            masterKeyConfigured: boolean;
            cryptoSupport: boolean;
        };
    };
}
//# sourceMappingURL=encryption.service.d.ts.map