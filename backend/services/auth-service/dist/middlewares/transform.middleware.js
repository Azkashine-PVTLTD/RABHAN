"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFrontendToBackend = void 0;
const validation_utils_1 = require("../utils/validation.utils");
const logger_1 = require("../utils/logger");
/**
 * Middleware to transform frontend camelCase data to backend snake_case format
 * This runs before validation to ensure the data matches expected schema
 */
const transformFrontendToBackend = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        logger_1.logger.info('Transform middleware - Before:', req.body);
        req.body = (0, validation_utils_1.transformFrontendData)(req.body);
        logger_1.logger.info('Transform middleware - After:', req.body);
    }
    next();
};
exports.transformFrontendToBackend = transformFrontendToBackend;
//# sourceMappingURL=transform.middleware.js.map