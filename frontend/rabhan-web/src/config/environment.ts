// RABHAN Environment Configuration
// Configuration for different environments

export interface Config {
  apiUrl: string;
  documentServiceUrl: string;
  authServiceUrl: string;
  environment: 'development' | 'production' | 'testing';
  enableLogging: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  supportedLanguages: string[];
  defaultLanguage: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
}

const development: Config = {
  apiUrl: '/api',
  documentServiceUrl: '/api/documents',
  authServiceUrl: '/api/auth',
  environment: 'development',
  enableLogging: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  supportedLanguages: ['en', 'ar'],
  defaultLanguage: 'en',
  theme: {
    primaryColor: '#3eb2b1',
    accentColor: '#2c8a89',
    backgroundColor: '#ffffff',
  },
};

const production: Config = {
  apiUrl: '/api',
  documentServiceUrl: '/api/documents',
  authServiceUrl: '/api/auth',
  environment: 'production',
  enableLogging: false,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  supportedLanguages: ['en', 'ar'],
  defaultLanguage: 'en',
  theme: {
    primaryColor: '#3eb2b1',
    accentColor: '#2c8a89',
    backgroundColor: '#ffffff',
  },
};

const testing: Config = {
  apiUrl: '/api',
  documentServiceUrl: '/api/documents',
  authServiceUrl: '/api/auth',
  environment: 'testing',
  enableLogging: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB for testing
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  supportedLanguages: ['en', 'ar'],
  defaultLanguage: 'en',
  theme: {
    primaryColor: '#3eb2b1',
    accentColor: '#2c8a89',
    backgroundColor: '#ffffff',
  },
};

function getConfig(): Config {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return production;
    case 'testing':
      return testing;
    default:
      return development;
  }
}

export const config = getConfig();
export const environment = config; // Alias for backward compatibility
export default config;