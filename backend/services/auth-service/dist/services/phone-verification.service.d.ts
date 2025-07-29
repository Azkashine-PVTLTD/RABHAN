export declare class PhoneVerificationService {
    private twilio;
    private redis;
    private pool;
    constructor();
    private generateOTP;
    private phonePatterns;
    private detectCountry;
    private validatePhoneNumber;
    private formatPhoneNumber;
    private getCountryName;
    private getPhoneExample;
    private generateSMSMessage;
    private getOTPAttempts;
    private incrementOTPAttempts;
    private clearOTPAttempts;
    sendOTP(phoneNumber: string, userId?: string, countryCode?: string): Promise<void>;
    verifyOTP(phoneNumber: string, otp: string, userId?: string, countryCode?: string): Promise<boolean>;
    private updatePhoneVerificationStatus;
    resendOTP(phoneNumber: string, userId?: string, countryCode?: string): Promise<void>;
    getSupportedCountries(): Array<{
        code: string;
        name: string;
        example: string;
        countryCode: string;
    }>;
    validatePhoneNumberPublic(phoneNumber: string, countryCode?: string): {
        isValid: boolean;
        country: string | null;
        formatted: string;
        countryName?: string;
    };
    isPhoneVerified(phoneNumber: string): Promise<boolean>;
    isDummyOTPMode(): boolean;
    getDummyOTP(): string;
    testOTPVerification(phoneNumber: string, userId?: string): Promise<{
        otp: string;
        message: string;
    }>;
}
//# sourceMappingURL=phone-verification.service.d.ts.map