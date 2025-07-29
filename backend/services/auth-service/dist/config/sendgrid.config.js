"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridConfig = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const environment_config_1 = require("./environment.config");
const logger_1 = require("../utils/logger");
class SendGridConfig {
    static instance;
    isConfigured = false;
    constructor() {
        if (!environment_config_1.config.sendgrid.apiKey) {
            if (process.env.NODE_ENV === 'development') {
                logger_1.logger.warn('SendGrid API key not provided - using mock email service for development');
                this.isConfigured = false;
                return;
            }
            throw new Error('SendGrid configuration missing: SENDGRID_API_KEY is required');
        }
        mail_1.default.setApiKey(environment_config_1.config.sendgrid.apiKey);
        this.isConfigured = true;
        logger_1.logger.info('SendGrid client initialized');
    }
    static getInstance() {
        if (!SendGridConfig.instance) {
            SendGridConfig.instance = new SendGridConfig();
        }
        return SendGridConfig.instance;
    }
    async sendEmail(to, subject, html) {
        if (!this.isConfigured) {
            // Mock email service for development
            logger_1.logger.info(`📧 [MOCK EMAIL] To: ${to}, Subject: ${subject}`);
            logger_1.logger.debug(`📧 [MOCK EMAIL] HTML Content: ${html.substring(0, 100)}...`);
            return;
        }
        try {
            const msg = {
                to,
                from: {
                    email: environment_config_1.config.sendgrid.fromEmail,
                    name: environment_config_1.config.sendgrid.fromName,
                },
                subject,
                html,
            };
            await mail_1.default.send(msg);
            logger_1.logger.info(`Email sent successfully to ${to}`);
        }
        catch (error) {
            logger_1.logger.error('SendGrid email error:', error);
            throw new Error('Failed to send email');
        }
    }
    async sendTemplateEmail(to, templateId, dynamicData) {
        if (!this.isConfigured) {
            // Mock template email service for development
            logger_1.logger.info(`📧 [MOCK TEMPLATE EMAIL] To: ${to}, Template: ${templateId}`);
            logger_1.logger.debug(`📧 [MOCK TEMPLATE DATA]:`, dynamicData);
            return;
        }
        try {
            const msg = {
                to,
                from: {
                    email: environment_config_1.config.sendgrid.fromEmail,
                    name: environment_config_1.config.sendgrid.fromName,
                },
                templateId,
                dynamicTemplateData: dynamicData,
            };
            await mail_1.default.send(msg);
            logger_1.logger.info(`Template email sent successfully to ${to}`);
        }
        catch (error) {
            logger_1.logger.error('SendGrid template email error:', error);
            throw new Error('Failed to send template email');
        }
    }
}
exports.SendGridConfig = SendGridConfig;
//# sourceMappingURL=sendgrid.config.js.map