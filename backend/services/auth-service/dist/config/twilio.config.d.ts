import { Twilio } from 'twilio';
export declare class TwilioConfig {
    private static instance;
    private client;
    private constructor();
    static getInstance(): TwilioConfig;
    getClient(): Twilio;
    getPhoneNumber(): string;
    sendSMS(to: string, body: string): Promise<void>;
    validatePhoneNumber(phoneNumber: string): Promise<boolean>;
}
//# sourceMappingURL=twilio.config.d.ts.map