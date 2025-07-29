"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioConfig = void 0;
const twilio_1 = require("twilio");
const environment_config_1 = require("./environment.config");
const logger_1 = require("../utils/logger");
class TwilioConfig {
    static instance;
    client;
    constructor() {
        if (!environment_config_1.config.twilio.accountSid || !environment_config_1.config.twilio.authToken || !environment_config_1.config.twilio.phoneNumber) {
            throw new Error('Twilio configuration missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required');
        }
        this.client = new twilio_1.Twilio(environment_config_1.config.twilio.accountSid, environment_config_1.config.twilio.authToken);
        logger_1.logger.info('Twilio client initialized');
    }
    static getInstance() {
        if (!TwilioConfig.instance) {
            TwilioConfig.instance = new TwilioConfig();
        }
        return TwilioConfig.instance;
    }
    getClient() {
        return this.client;
    }
    getPhoneNumber() {
        return environment_config_1.config.twilio.phoneNumber || '';
    }
    async sendSMS(to, body) {
        try {
            logger_1.logger.info(`Attempting to send SMS to ${to} from ${environment_config_1.config.twilio.phoneNumber}`);
            const message = await this.client.messages.create({
                body,
                to,
                from: environment_config_1.config.twilio.phoneNumber || '',
            });
            logger_1.logger.info(`SMS sent successfully to ${to}`, {
                messageSid: message.sid,
                status: message.status,
                direction: message.direction,
                price: message.price,
                priceUnit: message.priceUnit
            });
        }
        catch (error) {
            logger_1.logger.error('Twilio SMS error:', {
                error: error.message,
                code: error.code,
                moreInfo: error.moreInfo,
                status: error.status,
                details: error
            });
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }
    async validatePhoneNumber(phoneNumber) {
        try {
            const lookup = await this.client.lookups.v2.phoneNumbers(phoneNumber).fetch();
            return lookup.valid;
        }
        catch (error) {
            logger_1.logger.error('Phone number validation error:', error);
            return false;
        }
    }
}
exports.TwilioConfig = TwilioConfig;
//# sourceMappingURL=twilio.config.js.map