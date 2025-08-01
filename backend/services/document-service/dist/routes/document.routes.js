"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
const documentController = new document_controller_1.DocumentController();
router.use(upload_middleware_1.securityHeaders);
router.use(upload_middleware_1.requestId);
router.use(upload_middleware_1.requestLogger);
router.use(upload_middleware_1.corsMiddleware);
router.use(upload_middleware_1.authenticate);
router.post('/upload', upload_middleware_1.uploadMiddleware.single('file'), upload_middleware_1.handleUploadError, upload_middleware_1.validateUploadRequest, documentController.uploadDocument);
router.get('/:documentId/download', documentController.downloadDocument);
router.get('/:documentId', documentController.getDocumentInfo);
router.delete('/:documentId', documentController.deleteDocument);
router.get('/', documentController.listDocuments);
router.get('/categories/list', documentController.getCategories);
router.get('/health/status', documentController.getHealthStatus);
router.use(upload_middleware_1.errorHandler);
exports.default = router;
//# sourceMappingURL=document.routes.js.map