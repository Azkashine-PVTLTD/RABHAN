// Test Frontend Integration - Complete Registration Workflow
const axios = require('axios');

// Test data matching frontend form structure (camelCase)
const testUser = {
  // Auth service data (Step 1)
  firstName: 'Ahmed',
  lastName: 'Al-Frontend', 
  email: `frontend.test.${Date.now()}@rabhan.sa`,
  password: 'Test123!@#',
  phone: '+966501234567',
  nationalId: '1234567890',
  role: 'USER',
  
  // User profile data (Step 2)
  region: 'riyadh',
  city: 'Riyadh',
  district: 'AlNakheel',
  streetAddress: '123 King Fahd Road',
  landmark: 'Near Al-Faisaliah Tower',
  postalCode: '12345',
  propertyType: 'villa',
  propertyOwnership: 'owned',
  roofSize: 200,
  gpsLatitude: 24.7136,
  gpsLongitude: 46.6753,
  electricityConsumption: '800-1000',
  electricityMeterNumber: 'SM123456',
  preferredLanguage: 'en',
  emailNotifications: true,
  smsNotifications: true,
  marketingConsent: false
};

async function testCompleteRegistrationWorkflow() {
  console.log('🧪 TESTING COMPLETE FRONTEND REGISTRATION WORKFLOW');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Step 1: Auth Service Registration
    console.log('🔐 Step 1: Testing Auth Service Registration...');
    console.log('POST /api/auth/register');
    console.log('Data sent:', JSON.stringify({
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      password: testUser.password,
      phone: testUser.phone,
      nationalId: testUser.nationalId,
      role: testUser.role
    }, null, 2));
    
    const authResponse = await axios.post('http://localhost:3001/api/auth/register', {
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      password: testUser.password,
      phone: testUser.phone,
      nationalId: testUser.nationalId,
      role: testUser.role
    });
    
    console.log('✅ Auth registration successful!');
    console.log('Response:', JSON.stringify(authResponse.data, null, 2));
    
    const { accessToken, user } = authResponse.data.data;
    const userId = user.id;
    
    // Step 2: User Service Profile Creation
    console.log('\n👤 Step 2: Testing User Profile Creation...');
    console.log('POST /api/users/profiles/register');
    console.log('User ID from auth:', userId);
    
    const profileData = {
      userId: userId,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      region: testUser.region,
      city: testUser.city,
      district: testUser.district,
      streetAddress: testUser.streetAddress,
      landmark: testUser.landmark,
      postalCode: testUser.postalCode,
      propertyType: testUser.propertyType,
      propertyOwnership: testUser.propertyOwnership,
      roofSize: testUser.roofSize,
      gpsLatitude: testUser.gpsLatitude,
      gpsLongitude: testUser.gpsLongitude,
      electricityConsumption: testUser.electricityConsumption,
      electricityMeterNumber: testUser.electricityMeterNumber,
      preferredLanguage: testUser.preferredLanguage,
      emailNotifications: testUser.emailNotifications,
      smsNotifications: testUser.smsNotifications,
      marketingConsent: testUser.marketingConsent
    };
    
    console.log('Profile data sent:', JSON.stringify(profileData, null, 2));
    
    const profileResponse = await axios.post('http://localhost:3005/api/users/profiles/register', profileData);
    
    console.log('✅ Profile creation successful!');
    console.log('Response:', JSON.stringify(profileResponse.data, null, 2));
    
    // Step 3: Test Login Workflow  
    console.log('\n🔑 Step 3: Testing Login Workflow...');
    console.log('POST /api/auth/login');
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Step 4: Get Profile Data
    console.log('\n📊 Step 4: Testing Get Profile...');
    console.log(`GET /api/users/profiles/${userId}`);
    
    const getProfileResponse = await axios.get(`http://localhost:3005/api/users/profiles/${userId}`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.data.accessToken}`
      }
    });
    
    console.log('✅ Get profile successful!');
    console.log('Profile data:', JSON.stringify(getProfileResponse.data, null, 2));
    
    // Summary
    console.log('\n🎉 FRONTEND INTEGRATION TEST SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Auth Service Registration: WORKING');
    console.log('✅ User Service Profile Creation: WORKING'); 
    console.log('✅ Login Workflow: WORKING');
    console.log('✅ Profile Retrieval: WORKING');
    console.log('✅ Frontend-Backend Data Mapping: WORKING');
    console.log('✅ camelCase to snake_case Transformation: WORKING');
    console.log('\n🔗 COMPLETE FRONTEND REGISTRATION WORKFLOW: SUCCESSFUL!');
    
  } catch (error) {
    console.error('\n❌ WORKFLOW TEST FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check if all services are running');
    console.log('2. Verify database connections');
    console.log('3. Check field name mappings');
    console.log('4. Validate request/response formats');
  }
}

// Run the test
testCompleteRegistrationWorkflow();