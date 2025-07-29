#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const server_1 = __importDefault(require("./server"));
async function main() {
    try {
        logger_1.logger.info('Starting RABHAN Document Service');
        await server_1.default.start();
    }
    catch (error) {
        logger_1.logger.error('Failed to start Document Service:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
main();
exports.default = server_1.default;
//# sourceMappingURL=index.js.map