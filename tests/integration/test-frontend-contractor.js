const axios = require('axios');

// Test contractor registration through frontend (using same API call as frontend)
async function testFrontendContractorRegistration() {
  try {
    const testData = {
      firstName: 'Sarah',
      lastName: 'Al-Rashid', 
      email: 'frontend-contractor@test.com',
      password: 'TestPassword123!',
      phone: '+966501234569',
      companyName: 'Al-Rashid Solar Solutions',
      crNumber: '1010987654',
      vatNumber: '300987654321007',
      userType: 'BUSINESS',
      role: 'CONTRACTOR'
    };

    console.log('🚀 Testing contractor registration through frontend API...');
    console.log('Data:', testData);

    const response = await axios.post('http://127.0.0.1:3001/api/auth/contractor/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Frontend Contractor Registration Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.accessToken) {
      console.log('✅ Access token received - registration completed successfully!');
    }
    
    return true;

  } catch (error) {
    console.error('❌ Frontend Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test login with the new contractor
async function testNewContractorLogin() {
  try {
    console.log('🔑 Testing new contractor login...');
    
    const loginResponse = await axios.post('http://127.0.0.1:3001/api/auth/login', {
      email: 'frontend-contractor@test.com',
      password: 'TestPassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ New Contractor Login Success!');
    console.log('User Role:', loginResponse.data.data.user.role);
    console.log('User Type:', loginResponse.data.data.user.user_type);
    console.log('User Status:', loginResponse.data.data.user.status);
    
    return true;

  } catch (error) {
    console.error('❌ New Contractor Login Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run both tests
async function runTests() {
  console.log('=== Testing Frontend Contractor Registration Flow ===\n');
  
  const registrationSuccess = await testFrontendContractorRegistration();
  if (!registrationSuccess) {
    process.exit(1);
  }
  
  console.log('\n=== Testing Login with New Contractor ===\n');
  
  const loginSuccess = await testNewContractorLogin();
  if (!loginSuccess) {
    process.exit(1);
  }
  
  console.log('\n✅ All frontend contractor tests passed!');
  process.exit(0);
}

runTests();