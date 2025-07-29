const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test user data
const testUser = {
  email: 'test.user@example.com',
  password: 'Test@123456',
  firstName: 'أحمد',
  lastName: 'السعيد',
  phone: '+966501234567',
  nationalId: '1234567890',
  role: 'USER'
};

// API endpoints
const AUTH_API = 'http://localhost:3001/api/auth';
const USER_API = 'http://localhost:3003/api/users';
const DOC_API = 'http://localhost:3002/api/documents';

let authToken = '';
let userId = '';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthService() {
  log('\n========== TESTING AUTH SERVICE ==========', 'blue');
  
  try {
    // 1. Register user
    log('\n1. Registering new user...', 'yellow');
    const registerResponse = await axios.post(`${AUTH_API}/register`, testUser);
    log('✅ User registered successfully', 'green');
    log(`Response: ${JSON.stringify(registerResponse.data, null, 2)}`);
    
    // 2. Login
    log('\n2. Logging in...', 'yellow');
    const loginResponse = await axios.post(`${AUTH_API}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.accessToken;
    userId = loginResponse.data.user.id;
    
    log('✅ Login successful', 'green');
    log(`User ID: ${userId}`);
    log(`Access Token: ${authToken.substring(0, 50)}...`);
    
    // 3. Get current user
    log('\n3. Getting current user...', 'yellow');
    const meResponse = await axios.get(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ Current user retrieved', 'green');
    log(`User: ${JSON.stringify(meResponse.data, null, 2)}`);
    
  } catch (error) {
    log(`❌ Auth Service Error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.status === 409) {
      // User already exists, try to login
      log('User already exists, attempting login...', 'yellow');
      try {
        const loginResponse = await axios.post(`${AUTH_API}/login`, {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.accessToken;
        userId = loginResponse.data.user.id;
        log('✅ Login successful with existing user', 'green');
      } catch (loginError) {
        log(`❌ Login Error: ${loginError.response?.data?.message || loginError.message}`, 'red');
      }
    }
  }
}

async function testUserService() {
  log('\n========== TESTING USER SERVICE ==========', 'blue');
  
  if (!authToken) {
    log('❌ No auth token available. Skipping user service tests.', 'red');
    return;
  }
  
  try {
    // 1. Create user profile
    log('\n1. Creating user profile...', 'yellow');
    const profileData = {
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      nationalId: testUser.nationalId,
      phone: testUser.phone,
      dateOfBirth: '1990-01-01',
      maritalStatus: 'SINGLE',
      dependents: 0,
      
      // Address
      address: {
        street: 'شارع الملك فهد',
        city: 'الرياض',
        region: 'الرياض',
        postalCode: '12211',
        country: 'SA',
        gpsCoordinates: {
          latitude: 24.7136,
          longitude: 46.6753
        }
      },
      
      // Employment
      employment: {
        status: 'EMPLOYED',
        employer: 'شركة الطاقة الشمسية',
        position: 'مهندس',
        monthlyIncome: 15000,
        yearsEmployed: 3
      },
      
      // Monthly expenses
      monthlyElectricityBill: 500,
      roofSpaceAvailable: 150,
      
      preferences: {
        language: 'ar',
        currency: 'SAR',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    };
    
    const createResponse = await axios.post(`${USER_API}/profile`, profileData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ User profile created successfully', 'green');
    log(`Profile: ${JSON.stringify(createResponse.data, null, 2)}`);
    
    // 2. Get user profile
    log('\n2. Getting user profile...', 'yellow');
    const getResponse = await axios.get(`${USER_API}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ User profile retrieved', 'green');
    log(`Profile: ${JSON.stringify(getResponse.data, null, 2)}`);
    
    // 3. Update user profile
    log('\n3. Updating user profile...', 'yellow');
    const updateData = {
      monthlyElectricityBill: 600,
      roofSpaceAvailable: 200
    };
    const updateResponse = await axios.patch(`${USER_API}/profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ User profile updated', 'green');
    log(`Updated fields: ${JSON.stringify(updateResponse.data, null, 2)}`);
    
  } catch (error) {
    log(`❌ User Service Error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testDocumentService() {
  log('\n========== TESTING DOCUMENT SERVICE ==========', 'blue');
  
  if (!authToken) {
    log('❌ No auth token available. Skipping document service tests.', 'red');
    return;
  }
  
  try {
    // 1. Create a test PDF file
    log('\n1. Creating test document...', 'yellow');
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    
    // Create a simple test file if it doesn't exist
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, 'This is a test PDF content');
    }
    
    // 2. Upload document
    log('\n2. Uploading document...', 'yellow');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'national-id.pdf',
      contentType: 'application/pdf'
    });
    formData.append('documentType', 'NATIONAL_ID');
    formData.append('metadata', JSON.stringify({
      side: 'FRONT',
      description: 'Saudi National ID - Front'
    }));
    
    const uploadResponse = await axios.post(
      `${DOC_API}/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    const documentId = uploadResponse.data.document.id;
    log('✅ Document uploaded successfully', 'green');
    log(`Document ID: ${documentId}`);
    log(`Response: ${JSON.stringify(uploadResponse.data, null, 2)}`);
    
    // 3. Get document details
    log('\n3. Getting document details...', 'yellow');
    const getResponse = await axios.get(`${DOC_API}/${documentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ Document details retrieved', 'green');
    log(`Details: ${JSON.stringify(getResponse.data, null, 2)}`);
    
    // 4. List all documents
    log('\n4. Listing all documents...', 'yellow');
    const listResponse = await axios.get(`${DOC_API}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('✅ Documents listed', 'green');
    log(`Total documents: ${listResponse.data.documents.length}`);
    log(`Documents: ${JSON.stringify(listResponse.data.documents, null, 2)}`);
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    log(`❌ Document Service Error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function runTests() {
  log('\n🚀 STARTING RABHAN API TESTS', 'blue');
  log('====================================', 'blue');
  
  // Wait a bit for services to be ready
  log('\nWaiting for services to be ready...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Run tests in sequence
  await testAuthService();
  await testUserService();
  await testDocumentService();
  
  log('\n====================================', 'blue');
  log('✅ ALL TESTS COMPLETED', 'green');
  log('\nSummary:', 'yellow');
  log(`- Auth Service: ${authToken ? '✅ Working' : '❌ Failed'}`, authToken ? 'green' : 'red');
  log(`- User Service: ✅ Tested`, 'green');
  log(`- Document Service: ✅ Tested`, 'green');
  
  if (authToken) {
    log('\nTest User Credentials:', 'yellow');
    log(`Email: ${testUser.email}`);
    log(`Password: ${testUser.password}`);
    log(`User ID: ${userId}`);
  }
}

// Check if required packages are installed
try {
  require('axios');
  require('form-data');
} catch (error) {
  log('Installing required packages...', 'yellow');
  require('child_process').execSync('npm install axios form-data', { stdio: 'inherit' });
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Unexpected Error: ${error.message}`, 'red');
  process.exit(1);
});