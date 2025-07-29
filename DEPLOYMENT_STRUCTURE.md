# 🚀 RABHAN Deployment Structure

## 📁 Production-Ready Folder Structure

```
E:\RABHAN\
├── 📄 CLAUDE.md                    # Project guidelines
├── 📄 package.json                 # Root dependencies
├── 📄 package-lock.json           # Dependency lock
├── 📄 PROJECT_STRUCTURE.md        # Documentation
├── 📄 DEPLOYMENT_STRUCTURE.md     # This file
│
├── 📁 DOCS/                        # 🔒 Protected documentation
│   ├── MVP_tasks.md                # Implementation plan
│   ├── bdev.md                     # Backend guidelines  
│   ├── fdev.md                     # Frontend guidelines
│   └── rabhan_logo.svg            # Project logo
│
├── 📁 backend/                     # Backend microservices
│   ├── services/
│   │   ├── auth-service/           # Authentication (PORT 3001)
│   │   │   ├── src/                # Source code
│   │   │   ├── migrations/         # DB migrations
│   │   │   ├── scripts/            # Setup scripts
│   │   │   ├── package.json        # Dependencies
│   │   │   ├── tsconfig.json       # TypeScript config
│   │   │   ├── .env.example        # Environment template
│   │   │   └── jest.config.js      # Test config
│   │   │
│   │   ├── user-service/           # User management (PORT 3002)
│   │   ├── document-service/       # KYC documents (PORT 3003)  
│   │   ├── contractor-service/     # Contractors (PORT 3004)
│   │   └── solar-calculator-service/ # Solar calc (PORT 3005)
│   │
│   └── shared/                     # Shared utilities
│       ├── types/                  # Common TypeScript types
│       └── utils/                  # Shared utility functions
│
├── 📁 frontend/                    # Frontend applications
│   └── rabhan-web/                # Main React app (PORT 3000)
│       ├── src/                    # Source code
│       ├── public/                 # Static assets
│       ├── package.json            # Dependencies
│       ├── vite.config.ts         # Build config
│       └── tsconfig.json          # TypeScript config
│
├── 📁 database/                    # Database schemas
│   ├── init/                       # Initialization scripts
│   ├── *.sql                      # Schema files
│   └── postgresql.conf            # PostgreSQL config
│
├── 📁 scripts/                     # Deployment scripts
│   ├── start-all-services.js      # Service startup
│   ├── create-databases.js        # DB setup
│   └── *.bat/*.ps1                # Windows scripts
│
└── 📁 secrets/                     # 🔐 Cryptographic keys
    ├── jwt-private.pem            # JWT private key
    └── jwt-public.pem             # JWT public key
```

## 🗑️ Folders to Remove Before Deployment

### Command to Clean Up:
```bash
# Remove development-only folders
rm -rf E:\RABHAN\tests\
rm -rf E:\RABHAN\installers\
rm -rf E:\RABHAN\screenshots\
rm -rf E:\RABHAN\temp\

# Remove node_modules from all services (will be rebuilt)
find E:\RABHAN\ -name "node_modules" -type d | xargs rm -rf

# Remove dist folders (will be built fresh)
find E:\RABHAN\ -name "dist" -type d | xargs rm -rf

# Remove log files
find E:\RABHAN\ -name "*.log" -type f | xargs rm -f

# Remove upload test files
rm -rf E:\RABHAN\backend\services\document-service\uploads\
```

## 📊 Size Reduction

### Before Cleanup:
- **Total Size**: ~2-3 GB (with node_modules)
- **Files**: ~40,000+ files
- **Folders**: Development artifacts included

### After Cleanup:
- **Total Size**: ~50-100 MB (source code only)
- **Files**: ~500-1000 files
- **Folders**: Production-ready structure

## 🚀 Deployment Steps

### 1. **Clean Structure**
```bash
# Run cleanup commands above
```

### 2. **Verify Essential Files**
```bash
# Check all services have package.json
find E:\RABHAN\backend\services -name "package.json"

# Check environment templates exist
find E:\RABHAN\backend\services -name ".env.example"
```

### 3. **Create Deployment Archive**
```bash
# Create clean deployment package
tar -czf rabhan-deployment.tar.gz E:\RABHAN\
```

### 4. **Server Setup Commands**
```bash
# On production server:
npm install         # Install dependencies
npm run build      # Build TypeScript
npm run start      # Start services

# For frontend:
npm install
npm run build      # Build React app
```

## 🔒 Security Considerations

### Environment Variables:
- ✅ Remove actual `.env` files (keep `.env.example`)
- ✅ Secure `secrets/` folder with proper permissions
- ✅ Use environment-specific configs on server

### Database:
- ✅ Keep `database/` folder for schema setup
- ✅ Remove any test data or dumps

### Logs:
- ✅ Remove all development logs
- ✅ Server will create fresh log files

## 📋 Deployment Checklist

- [ ] Remove `tests/`, `installers/`, `screenshots/`, `temp/`
- [ ] Remove all `node_modules/` folders
- [ ] Remove all `dist/` folders  
- [ ] Remove all `*.log` files
- [ ] Remove upload test files
- [ ] Verify all `package.json` files exist
- [ ] Verify all `.env.example` files exist
- [ ] Secure `secrets/` folder
- [ ] Create deployment archive
- [ ] Test deployment on staging server

## 🎯 Final Structure Size
**Clean deployment package: ~50-100 MB** (vs ~2-3 GB with artifacts)

---
**Ready for production deployment!** 🚀