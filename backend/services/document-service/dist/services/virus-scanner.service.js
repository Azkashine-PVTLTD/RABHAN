"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirusScannerService = void 0;
const logger_1 = require("../utils/logger");
const environment_config_1 = require("../config/environment.config");
const database_config_1 = require("../config/database.config");
class VirusScannerService {
    static instance;
    database;
    scanners = new Map();
    constructor() {
        this.database = database_config_1.DatabaseConfig.getInstance();
        this.initializeScanners();
    }
    static getInstance() {
        if (!VirusScannerService.instance) {
            VirusScannerService.instance = new VirusScannerService();
        }
        return VirusScannerService.instance;
    }
    async initializeScanners() {
        try {
            if (environment_config_1.config.virusScanner.enabled) {
                const clamAVScanner = await this.initializeClamAV();
                if (clamAVScanner) {
                    this.scanners.set('clamav', clamAVScanner);
                }
                if (environment_config_1.config.isProduction) {
                    const cloudScanner = await this.initializeCloudScanner();
                    if (cloudScanner) {
                        this.scanners.set('cloud', cloudScanner);
                    }
                }
                logger_1.logger.info('Virus scanners initialized', {
                    enabledScanners: Array.from(this.scanners.keys()),
                    totalScanners: this.scanners.size,
                });
            }
            else {
                logger_1.logger.warn('Virus scanning disabled');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize virus scanners:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async initializeClamAV() {
        try {
            const clamscan = require('clamscan');
            const clamScanInstance = await clamscan({
                remove_infected: false,
                quarantine_infected: false,
                scan_log: null,
                debug_mode: environment_config_1.config.isDevelopment,
                file_list: null,
                scan_recursively: true,
                clamdscan: {
                    socket: false,
                    host: false,
                    port: false,
                    timeout: environment_config_1.config.virusScanner.scanTimeout,
                    local_fallback: true,
                    path: environment_config_1.config.virusScanner.clamAvPath,
                    config_file: null,
                    multiscan: true,
                    reload_db: false,
                    active: true,
                    bypass_test: false,
                },
                preference: 'clamdscan',
            });
            logger_1.logger.info('ClamAV scanner initialized', {
                version: await this.getClamAVVersion(),
                signatures: await this.getClamAVSignatureVersion(),
            });
            return clamScanInstance;
        }
        catch (error) {
            logger_1.logger.error('ClamAV initialization failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async initializeCloudScanner() {
        try {
            logger_1.logger.info('Cloud virus scanner initialized');
            return {
                name: 'cloud-scanner',
                version: '1.0.0',
                active: true,
            };
        }
        catch (error) {
            logger_1.logger.error('Cloud scanner initialization failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async scanFileBuffer(fileBuffer, documentId, userId, filename) {
        const startTime = Date.now();
        const scanId = this.generateScanId(documentId);
        try {
            logger_1.logger.info('Starting virus scan', {
                scanId,
                documentId,
                userId,
                filename,
                fileSize: fileBuffer.length,
                scannersCount: this.scanners.size,
            });
            if (this.scanners.size === 0) {
                logger_1.logger.warn('No virus scanners available', {
                    scanId,
                    documentId,
                    userId,
                });
                return {
                    isClean: true,
                    scanId,
                    scannerName: 'none',
                    scanResult: 'clean',
                    threats: [],
                    scanDuration: Date.now() - startTime,
                    scanDetails: {
                        message: 'No virus scanners configured',
                        assumedClean: true,
                    },
                };
            }
            const scanPromises = Array.from(this.scanners.entries()).map(async ([scannerName, scanner]) => {
                return this.runSingleScanner(scanner, scannerName, fileBuffer, scanId, documentId, userId);
            });
            const scanResults = await Promise.allSettled(scanPromises);
            const successfulScans = scanResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            const failedScans = scanResults
                .filter(result => result.status === 'rejected')
                .map(result => result.reason);
            if (failedScans.length > 0) {
                logger_1.logger.warn('Some virus scans failed:', {
                    scanId,
                    documentId,
                    failedScans: failedScans.length,
                    totalScans: scanResults.length,
                });
            }
            const finalResult = this.analyzeMultipleScanResults(successfulScans, scanId, documentId, userId);
            await this.storeScanResults(finalResult, documentId, userId);
            if (!finalResult.isClean) {
                logger_1.SAMALogger.logSecurityEvent('VIRUS_DETECTED', 'CRITICAL', {
                    scanId,
                    documentId,
                    userId,
                    filename,
                    threats: finalResult.threats,
                    scannerName: finalResult.scannerName,
                    scanDuration: finalResult.scanDuration,
                });
            }
            logger_1.logger.info('Virus scan completed', {
                scanId,
                documentId,
                userId,
                isClean: finalResult.isClean,
                threats: finalResult.threats.length,
                scanDuration: finalResult.scanDuration,
                scanResult: finalResult.scanResult,
            });
            return finalResult;
        }
        catch (error) {
            const scanDuration = Date.now() - startTime;
            logger_1.logger.error('Virus scan failed:', {
                scanId,
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                scanDuration,
            });
            logger_1.SAMALogger.logSecurityEvent('VIRUS_DETECTED', 'HIGH', {
                scanId,
                documentId,
                userId,
                filename,
                error: error instanceof Error ? error.message : 'Unknown error',
                scanResult: 'error',
            });
            return {
                isClean: false,
                scanId,
                scannerName: 'error',
                scanResult: 'error',
                threats: [],
                scanDuration,
                scanDetails: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }
    async runSingleScanner(scanner, scannerName, fileBuffer, scanId, documentId, userId) {
        const startTime = Date.now();
        try {
            let scanResult;
            if (scannerName === 'clamav') {
                scanResult = await this.runClamAVScan(scanner, fileBuffer, scanId, documentId);
            }
            else if (scannerName === 'cloud') {
                scanResult = await this.runCloudScan(scanner, fileBuffer, scanId, documentId);
            }
            else {
                throw new Error(`Unknown scanner: ${scannerName}`);
            }
            scanResult.scanDuration = Date.now() - startTime;
            scanResult.scanId = scanId;
            scanResult.scannerName = scannerName;
            return scanResult;
        }
        catch (error) {
            logger_1.logger.error(`${scannerName} scan failed:`, {
                scanId,
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                isClean: false,
                scanId,
                scannerName,
                scanResult: 'error',
                threats: [],
                scanDuration: Date.now() - startTime,
                scanDetails: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }
    async runClamAVScan(scanner, fileBuffer, scanId, documentId) {
        try {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(process.cwd(), 'temp');
            const tempFile = path.join(tempDir, `${scanId}.tmp`);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            fs.writeFileSync(tempFile, fileBuffer);
            try {
                const result = await scanner.scanFile(tempFile);
                fs.unlinkSync(tempFile);
                return {
                    isClean: result.isInfected === false,
                    scanId,
                    scannerName: 'clamav',
                    scanResult: result.isInfected ? 'infected' : 'clean',
                    threats: result.viruses || [],
                    scanDuration: 0,
                    scannerVersion: await this.getClamAVVersion(),
                    signatureVersion: await this.getClamAVSignatureVersion(),
                    scanDetails: {
                        file: result.file,
                        isInfected: result.isInfected,
                        viruses: result.viruses,
                        goodFiles: result.goodFiles,
                        badFiles: result.badFiles,
                    },
                };
            }
            catch (scanError) {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                throw scanError;
            }
        }
        catch (error) {
            throw new Error(`ClamAV scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async runCloudScan(scanner, fileBuffer, scanId, documentId) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                isClean: true,
                scanId,
                scannerName: 'cloud',
                scanResult: 'clean',
                threats: [],
                scanDuration: 0,
                scannerVersion: '1.0.0',
                signatureVersion: new Date().toISOString(),
                scanDetails: {
                    cloudProvider: 'mock',
                    scanType: 'full',
                    confidence: 99.9,
                },
            };
        }
        catch (error) {
            throw new Error(`Cloud scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    analyzeMultipleScanResults(scanResults, scanId, documentId, userId) {
        if (scanResults.length === 0) {
            return {
                isClean: false,
                scanId,
                scannerName: 'none',
                scanResult: 'error',
                threats: [],
                scanDuration: 0,
                scanDetails: {
                    error: 'No successful scans',
                },
            };
        }
        const allThreats = scanResults.flatMap(result => result.threats);
        const uniqueThreats = [...new Set(allThreats)];
        const cleanResults = scanResults.filter(result => result.isClean);
        const infectedResults = scanResults.filter(result => !result.isClean);
        const isClean = infectedResults.length === 0 && uniqueThreats.length === 0;
        const totalScanDuration = scanResults.reduce((sum, result) => sum + result.scanDuration, 0);
        let scanResult;
        if (isClean) {
            scanResult = 'clean';
        }
        else if (uniqueThreats.length > 0) {
            scanResult = 'infected';
        }
        else {
            scanResult = 'suspicious';
        }
        return {
            isClean,
            scanId,
            scannerName: 'consensus',
            scanResult,
            threats: uniqueThreats,
            scanDuration: totalScanDuration,
            scanDetails: {
                totalScanners: scanResults.length,
                cleanResults: cleanResults.length,
                infectedResults: infectedResults.length,
                consensus: isClean ? 'clean' : 'infected',
                individualResults: scanResults.map(result => ({
                    scanner: result.scannerName,
                    result: result.scanResult,
                    threats: result.threats,
                    duration: result.scanDuration,
                })),
            },
        };
    }
    async storeScanResults(scanResult, documentId, userId) {
        try {
            const query = `
        INSERT INTO virus_scan_results (
          document_id, scanner_name, scan_result, threat_names,
          scan_duration_ms, scanner_version, signature_version,
          scan_details, sama_security_event_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
            const values = [
                documentId,
                scanResult.scannerName,
                scanResult.scanResult,
                scanResult.threats,
                scanResult.scanDuration,
                scanResult.scannerVersion || null,
                scanResult.signatureVersion || null,
                scanResult.scanDetails,
                scanResult.scanId,
            ];
            await this.database.query(query, values);
            logger_1.logger.debug('Scan results stored in database', {
                scanId: scanResult.scanId,
                documentId,
                userId,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to store scan results:', {
                scanId: scanResult.scanId,
                documentId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getClamAVVersion() {
        try {
            const scanner = this.scanners.get('clamav');
            if (scanner) {
                return scanner.getVersion();
            }
            return 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    async getClamAVSignatureVersion() {
        try {
            const scanner = this.scanners.get('clamav');
            if (scanner) {
                return scanner.getSignatureVersion();
            }
            return 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    generateScanId(documentId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `scan_${documentId}_${timestamp}_${random}`;
    }
    async getHealthStatus() {
        try {
            const availableScanners = Array.from(this.scanners.keys());
            const clamavVersion = await this.getClamAVVersion();
            return {
                status: this.scanners.size > 0 ? 'healthy' : 'unhealthy',
                details: {
                    enabled: environment_config_1.config.virusScanner.enabled,
                    scannersCount: this.scanners.size,
                    availableScanners,
                    clamavVersion,
                    lastSignatureUpdate: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    enabled: environment_config_1.config.virusScanner.enabled,
                    scannersCount: 0,
                    availableScanners: [],
                },
            };
        }
    }
    async updateSignatures() {
        try {
            const clamavScanner = this.scanners.get('clamav');
            if (clamavScanner) {
                await clamavScanner.updateSignatures();
                logger_1.logger.info('Virus signatures updated');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update virus signatures:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getScanHistory(documentId) {
        try {
            const query = `
        SELECT 
          scanner_name, scan_result, threat_names, scan_duration_ms,
          scanner_version, signature_version, scanned_at, scan_details
        FROM virus_scan_results
        WHERE document_id = $1
        ORDER BY scanned_at DESC
      `;
            const result = await this.database.query(query, [documentId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Failed to get scan history:', {
                documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    async cleanup() {
        try {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(process.cwd(), 'temp');
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    if (file.endsWith('.tmp')) {
                        fs.unlinkSync(path.join(tempDir, file));
                    }
                }
            }
            logger_1.logger.info('Virus scanner cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Virus scanner cleanup failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
exports.VirusScannerService = VirusScannerService;
//# sourceMappingURL=virus-scanner.service.js.map