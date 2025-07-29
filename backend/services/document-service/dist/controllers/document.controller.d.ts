import { Request, Response } from 'express';
export declare class DocumentController {
    private validationService;
    private storageService;
    private virusScannerService;
    private database;
    constructor();
    uploadDocument: (req: Request, res: Response) => Promise<void>;
    downloadDocument: (req: Request, res: Response) => Promise<void>;
    getDocumentInfo: (req: Request, res: Response) => Promise<void>;
    deleteDocument: (req: Request, res: Response) => Promise<void>;
    listDocuments: (req: Request, res: Response) => Promise<void>;
    getCategories: (req: Request, res: Response) => Promise<void>;
    getHealthStatus: (req: Request, res: Response) => Promise<void>;
    private generateDocumentId;
    private shouldPerformOCR;
    private getValidationRules;
    private saveDocumentMetadata;
    private getDocumentMetadata;
    private checkDocumentAccess;
    private markDocumentAsDeleted;
    private getUserDocuments;
    private getDocumentCategories;
    private getExistingDocumentsForCategory;
    private cleanupOldDocuments;
}
//# sourceMappingURL=document.controller.d.ts.map