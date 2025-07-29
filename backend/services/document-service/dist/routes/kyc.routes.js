"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kyc_controller_1 = require("../controllers/kyc.controller");
const router = (0, express_1.Router)();
const kycController = new kyc_controller_1.KYCController();
router.get('/status', kycController.getKYCStatus);
router.get('/requirements', kycController.getKYCRequirements);
router.post('/submit', kycController.submitKYCForReview);
router.get('/admin/pending', kycController.getPendingReviews);
router.post('/admin/approve', kycController.approveKYC);
router.post('/admin/reject', kycController.rejectKYC);
router.get('/health', kycController.getHealthStatus);
exports.default = router;
//# sourceMappingURL=kyc.routes.js.map