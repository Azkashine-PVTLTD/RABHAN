export interface ValidationResult {
    isValid: boolean;
    score: number;
    confidence: number;
    errors: string[];
    warnings: string[];
    extractedData: any;
    processingTime: number;
    checks: ValidationCheck[];
}
export interface ValidationCheck {
    type: string;
    passed: boolean;
    score: number;
    details: any;
    processingTime: number;
}
export interface DocumentMetadata {
    documentId: string;
    userId: string;
    categoryId: string;
    templateId?: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    requiresOCR: boolean;
    validationRules: any;
}
export declare class DocumentValidationService {
    private static instance;
    private tesseractWorker;
    private constructor();
    static getInstance(): DocumentValidationService;
    private initializeTesseract;
    validateDocument(fileBuffer: Buffer, metadata: DocumentMetadata): Promise<ValidationResult>;
    private validateFileFormat;
    private validateFileSize;
    private validateFileContent;
    private validatePDFContent;
    private validateImageContent;
    private validateBasicSecurity;
    private performOCRValidation;
    private validateDocumentSpecifics;
    private extractStructuredData;
    private validateNationalIdDocument;
    private validateCommercialRegistration;
    private calculateOverallScore;
    private calculateOverallConfidence;
    getHealthStatus(): {
        status: 'healthy' | 'unhealthy';
        details: {
            ocrEnabled: boolean;
            tesseractReady: boolean;
            supportedFormats: string[];
            maxFileSize: number;
        };
    };
    cleanup(): Promise<void>;
}
//# sourceMappingURL=document-validation.service.d.ts.map