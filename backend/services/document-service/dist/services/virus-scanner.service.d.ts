export interface VirusScanResult {
    isClean: boolean;
    scanId: string;
    scannerName: string;
    scanResult: 'clean' | 'infected' | 'suspicious' | 'error' | 'timeout';
    threats: string[];
    scanDuration: number;
    scannerVersion?: string;
    signatureVersion?: string;
    scanDetails: any;
}
export declare class VirusScannerService {
    private static instance;
    private database;
    private scanners;
    private constructor();
    static getInstance(): VirusScannerService;
    private initializeScanners;
    private initializeClamAV;
    private initializeCloudScanner;
    scanFileBuffer(fileBuffer: Buffer, documentId: string, userId: string, filename: string): Promise<VirusScanResult>;
    private runSingleScanner;
    private runClamAVScan;
    private runCloudScan;
    private analyzeMultipleScanResults;
    private storeScanResults;
    private getClamAVVersion;
    private getClamAVSignatureVersion;
    private generateScanId;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            enabled: boolean;
            scannersCount: number;
            availableScanners: string[];
            clamavVersion?: string;
            lastSignatureUpdate?: string;
        };
    }>;
    updateSignatures(): Promise<void>;
    getScanHistory(documentId: string): Promise<any[]>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=virus-scanner.service.d.ts.map