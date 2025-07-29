import { Twilio } from 'twilio';
import { config } from './environment.config';
import { logger } from '../utils/logger';

export class TwilioConfig {
  private static instance: TwilioConfig;
  private client: Twilio;

  private constructor() {
    if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
      throw new Error('Twilio configuration missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required');
    }

    this.client = new Twilio(config.twilio.accountSid, config.twilio.authToken);
    logger.info('Twilio client initialized');
  }

  public static getInstance(): TwilioConfig {
    if (!TwilioConfig.instance) {
      TwilioConfig.instance = new TwilioConfig();
    }
    return TwilioConfig.instance;
  }

  public getClient(): Twilio {
    return this.client;
  }

  public getPhoneNumber(): string {
    return config.twilio.phoneNumber || '';
  }

  public async sendSMS(to: string, body: string): Promise<void> {
    try {
      logger.info(`Attempting to send SMS to ${to} from ${config.twilio.phoneNumber}`);
      const message = await this.client.messages.create({
        body,
        to,
        from: config.twilio.phoneNumber || '',
      });
      logger.info(`SMS sent successfully to ${to}`, {
        messageSid: message.sid,
        status: message.status,
        direction: message.direction,
        price: message.price,
        priceUnit: message.priceUnit
      });
    } catch (error: any) {
      logger.error('Twilio SMS error:', {
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo,
        status: error.status,
        details: error
      });
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  public async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v2.phoneNumbers(phoneNumber).fetch();
      return lookup.valid;
    } catch (error) {
      logger.error('Phone number validation error:', error);
      return false;
    }
  }
}