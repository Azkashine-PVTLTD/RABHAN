const axios = require('axios');

// Test contractor registration
async function testContractorRegistration() {
  try {
    const testData = {
      firstName: 'Ahmed',
      lastName: 'Al-Saudi',
      email: 'contractor@test.com',
      password: 'TestPassword123!',
      phone: '+966501234567',
      companyName: 'Solar Solutions KSA',
      crNumber: '1010123456',
      vatNumber: '300123456789003',
      userType: 'FULL_CONTRACTOR'
    };

    console.log('🚀 Testing contractor registration...');
    console.log('Data:', testData);

    const response = await axios.post('http://127.0.0.1:3001/api/auth/contractor/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Contractor Registration Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test login with the contractor account
    console.log('\n🔑 Testing contractor login...');
    const loginResponse = await axios.post('http://127.0.0.1:3001/api/auth/login', {
      email: testData.email,
      password: testData.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Contractor Login Success!');
    console.log('User Role:', loginResponse.data.data.user.role);
    console.log('User Type:', loginResponse.data.data.user.user_type);
    
    return true;

  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run test
testContractorRegistration().then(success => {
  process.exit(success ? 0 : 1);
});