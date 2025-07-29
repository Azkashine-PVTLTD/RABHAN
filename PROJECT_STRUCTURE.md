# 🏗️ RABHAN Project Structure

## 📁 Root Directory Organization

```
E:\RABHAN\
├── 📄 CLAUDE.md                    # Project guidelines and instructions (protected)
├── 📄 package.json                 # Root package configuration
├── 📄 package-lock.json           # Dependency lock file
│
├── 📁 DOCS/                        # 🔒 Protected documentation folder
│   ├── MVP_tasks.md                # MVP implementation plan
│   ├── bdev.md                     # Backend development guidelines  
│   ├── fdev.md                     # Frontend development guidelines
│   ├── rabhan_logo.svg            # Official project logo
│   └── ... (other documentation)
│
├── 📁 backend/                     # Backend microservices
│   ├── services/
│   │   ├── auth-service/           # Authentication service
│   │   ├── user-service/           # User management service
│   │   ├── document-service/       # Document upload & KYC service
│   │   ├── contractor-service/     # Contractor management service
│   │   └── solar-calculator-service/ # Solar calculation service
│   └── shared/                     # Shared utilities and types
│       ├── types/                  # Common TypeScript types
│       └── utils/                  # Shared utility functions
│
├── 📁 frontend/                    # Frontend applications
│   ├── rabhan-web/                # Main React web application
│   └── shared/                     # Shared frontend components
│
├── 📁 database/                    # Database schemas and migrations
│   ├── init/                       # Database initialization scripts
│   ├── *.sql                      # Schema files
│   └── postgresql.conf            # PostgreSQL configuration
│
├── 📁 scripts/                     # Development and deployment scripts
│   ├── *.bat                      # Windows batch scripts
│   ├── *.ps1                      # PowerShell scripts
│   └── *.js                       # Node.js utility scripts
│
├── 📁 secrets/                     # 🔐 Cryptographic keys and certificates
│   ├── jwt-private.pem            # JWT private key
│   └── jwt-public.pem             # JWT public key
│
├── 📁 screenshots/                 # Project screenshots and images
│   ├── address.png
│   └── doc.png
│
├── 📁 installers/                  # Third-party software installers
│   └── Redis-x64-3.0.504.msi     # Redis installer for Windows
│
├── 📁 tests/                       # 🧪 Organized testing structure
│   ├── integration/                # Integration tests
│   │   ├── test-*.js              # API and service integration tests
│   │   ├── *.html                 # Frontend test pages
│   │   └── final-*.js             # End-to-end test scenarios
│   ├── debug/                      # Debug and analysis scripts
│   │   ├── debug-*.js             # Debugging utilities
│   │   ├── check-*.js             # Schema and data validation
│   │   ├── analyze-*.js           # Analysis scripts
│   │   └── fix-*.sql              # Database fix scripts
│   ├── assets/                     # Test assets and mock data
│   │   ├── *.png                  # Test images
│   │   ├── *.txt                  # Test documents
│   │   └── test-upload.*          # Upload test files
│   └── unit/                       # Unit tests (organized by service)
│
└── 📁 temp/                        # Temporary files and configurations
    └── auth-service.env           # Temporary environment file
```

## 🚀 Service Architecture

### Backend Services (Microservices)
1. **Auth Service** (Port 3001) - Authentication & authorization
2. **User Service** (Port 3002) - User profile management
3. **Document Service** (Port 3003) - KYC document handling
4. **Contractor Service** (Port 3004) - Contractor management
5. **Solar Calculator Service** (Port 3005) - Solar estimation engine

### Frontend Applications
1. **Rabhan Web** (Port 3000) - Main React application
   - User registration and profiles
   - Contractor dashboard
   - Solar calculator interface
   - Document upload and KYC

## 🔒 Security & Protection

### Protected Folders
- **DOCS/** - Read-only protection to prevent accidental deletion
- **secrets/** - Contains cryptographic keys and certificates

### File Organization Benefits
- ✅ **Clean root directory** - Only essential files remain
- ✅ **Organized testing** - Tests categorized by type and purpose
- ✅ **Debug isolation** - Debug scripts separated from production code
- ✅ **Asset management** - Test assets properly organized
- ✅ **Configuration safety** - Temporary configs isolated

## 📋 Development Guidelines

### Running Services
```bash
# Start all services
cd E:\RABHAN\scripts
.\start-all-services.js

# Individual service development
cd E:\RABHAN\backend\services\[service-name]
npm run dev
```

### Testing Structure
- **Integration tests**: Use `tests/integration/` for API and service tests
- **Debug scripts**: Use `tests/debug/` for troubleshooting and analysis  
- **Unit tests**: Use `tests/unit/` for isolated component tests
- **Test assets**: Store in `tests/assets/` for consistent test data

### File Management Rules
1. **Never modify DOCS** without changing permissions first
2. **Keep root clean** - new files should go in appropriate subfolders
3. **Use semantic naming** - test-*, debug-*, fix-* prefixes
4. **Organize by purpose** - separate development, testing, and production files

## 🎯 Next Steps

1. **Add .gitignore** for node_modules, logs, and temporary files
2. **Document API endpoints** for each service
3. **Create deployment guides** for production environment
4. **Set up automated testing** pipelines
5. **Implement monitoring** and logging standards

---

**Last updated**: January 2025  
**Structure organized by**: Claude Code Assistant