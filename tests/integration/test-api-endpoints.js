const axios = require('axios');

// Test data from frontend forms (matching our schema)
const testUser = {
  first_name: 'Omar',
  last_name: 'Al-Saud', 
  email: `omar.saud.${Date.now()}@test.sa`,
  phone: '+966501234568',
  national_id: `987654${Date.now().toString().slice(-4)}`,
  password: 'TestPass123!',
  role: 'USER'
};

const testProfile = {
  date_of_birth: '1990-05-20',
  marital_status: 'SINGLE',
  monthly_income: 12000.00,
  employment_status: 'EMPLOYED',
  employer_name: 'SABIC',
  
  // Address
  region: 'Eastern Province',
  city: 'Dammam',
  district: 'Al-Faisaliyah',
  street_address: '456 Prince Sultan Road',
  postal_code: '31411',
  gps_latitude: 26.4207,
  gps_longitude: 50.0888,
  
  // Property
  property_type: 'APARTMENT',
  property_ownership: 'RENTED',
  roof_size: 150.00,
  electricity_consumption: '600_800',
  electricity_meter_number: 'KSA987654321',
  
  // Solar preferences
  desired_system_size: 8.0,
  budget_range: '10K_25K',
  financing_preference: 'BNPL'
};

async function testServiceAPIs() {
  console.log('🔧 Testing Service APIs with New Database Schemas...\n');
  
  let authToken;
  let userId;
  
  try {
    // Test 1: Auth Service - User Registration
    console.log('1️⃣ Testing Auth Service - User Registration...');
    console.log(`   POST http://localhost:3001/api/auth/register`);
    
    const authResponse = await axios.post('http://localhost:3001/api/auth/register', testUser);
    
    if (authResponse.status === 201 || authResponse.status === 200) {
      console.log('✅ Auth Registration SUCCESS');
      console.log(`   Status: ${authResponse.status}`);
      console.log(`   User ID: ${authResponse.data.user?.id || authResponse.data.id}`);
      console.log(`   Email: ${authResponse.data.user?.email || authResponse.data.email}`);
      
      userId = authResponse.data.user?.id || authResponse.data.id;
      authToken = authResponse.data.token || authResponse.data.accessToken;
      
      if (authToken) {
        console.log(`   Token: ${authToken.substring(0, 50)}...`);
      }
    }
    
  } catch (error) {
    console.log('❌ Auth Registration FAILED');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    console.log(`   Details: ${JSON.stringify(error.response?.data, null, 2)}`);
  }
  
  try {
    // Test 2: Auth Service - Login
    console.log('\n2️⃣ Testing Auth Service - Login...');
    console.log(`   POST http://localhost:3001/api/auth/login`);
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Auth Login SUCCESS');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   User ID: ${loginResponse.data.user?.id}`);
      
      authToken = loginResponse.data.token || loginResponse.data.accessToken;
      userId = loginResponse.data.user?.id;
    }
    
  } catch (error) {
    console.log('❌ Auth Login FAILED');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
  }
  
  if (userId && authToken) {
    try {
      // Test 3: User Service - Profile Creation
      console.log('\n3️⃣ Testing User Service - Profile Creation...');
      console.log(`   POST http://localhost:3005/api/user/profile`);
      
      const profileData = {
        ...testProfile,
        auth_user_id: userId
      };
      
      const profileResponse = await axios.post('http://localhost:3005/api/user/profile', profileData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.status === 201 || profileResponse.status === 200) {
        console.log('✅ User Profile Creation SUCCESS');
        console.log(`   Status: ${profileResponse.status}`);
        console.log(`   Profile ID: ${profileResponse.data.id}`);
        console.log(`   Auth User ID: ${profileResponse.data.auth_user_id}`);
        console.log(`   Location: ${profileResponse.data.region}, ${profileResponse.data.city}`);
        console.log(`   Property: ${profileResponse.data.property_type}`);
      }
      
    } catch (error) {
      console.log('❌ User Profile Creation FAILED');
      console.log(`   Status: ${error.response?.status || 'Unknown'}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Details: ${JSON.stringify(error.response?.data, null, 2)}`);
    }
    
    try {
      // Test 4: User Service - Get Profile
      console.log('\n4️⃣ Testing User Service - Get Profile...');
      console.log(`   GET http://localhost:3005/api/user/profile`);
      
      const getProfileResponse = await axios.get('http://localhost:3005/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (getProfileResponse.status === 200) {
        console.log('✅ User Profile Retrieval SUCCESS');
        console.log(`   Status: ${getProfileResponse.status}`);
        console.log(`   Profile Found: ${getProfileResponse.data ? 'Yes' : 'No'}`);
        console.log(`   Completion: ${getProfileResponse.data?.profile_completion_percentage || 0}%`);
      }
      
    } catch (error) {
      console.log('❌ User Profile Retrieval FAILED');
      console.log(`   Status: ${error.response?.status || 'Unknown'}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Test 5: Check Available Endpoints
  console.log('\n5️⃣ Testing Available Endpoints...');
  
  const endpoints = [
    { service: 'Auth', url: 'http://localhost:3001/api/auth/health' },
    { service: 'Auth', url: 'http://localhost:3001/api/auth/me' },
    { service: 'User', url: 'http://localhost:3005/api/user/health' },
    { service: 'User', url: 'http://localhost:3005/api/user/profiles' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        timeout: 5000
      });
      console.log(`✅ ${endpoint.service}: ${endpoint.url} - ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint.service}: ${endpoint.url} - ${error.response?.status || 'Timeout/Error'}`);
    }
  }
  
  console.log('\n📊 API TEST SUMMARY:');
  console.log('=====================================');
  console.log('✅ Auth Service API endpoints tested');
  console.log('✅ User Service API endpoints tested');
  console.log('⚠️  Document Service not running - skipped');
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix any failing endpoints');
  console.log('2. Start Document Service for full testing');
  console.log('3. Test complete user registration flow via APIs');
  console.log('4. Integrate with frontend');
}

// Handle axios errors gracefully
axios.defaults.timeout = 10000;

testServiceAPIs().catch(console.error);