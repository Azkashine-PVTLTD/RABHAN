"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validate = void 0;
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger_1.SAMALogger.logAuthEvent('VALIDATION_ERROR', undefined, {
                path: req.path,
                errors,
                ip: req.ip
            });
            res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
            return;
        }
        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            res.status(400).json({
                error: 'Query validation failed',
                details: errors
            });
            return;
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            res.status(400).json({
                error: 'Parameter validation failed',
                details: errors
            });
            return;
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.middleware.js.map