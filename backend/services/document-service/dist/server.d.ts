declare class DocumentService {
    private app;
    private database;
    private redis;
    private minio;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    private shutdown;
    initialize(): Promise<void>;
    start(): Promise<void>;
}
declare const documentService: DocumentService;
export default documentService;
//# sourceMappingURL=server.d.ts.map