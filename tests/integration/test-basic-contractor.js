const axios = require('axios');

// Test basic contractor registration without company fields
async function testBasicContractorRegistration() {
  try {
    const testData = {
      firstName: 'Ahmed',
      lastName: 'Al-Saudi',
      email: 'basic-contractor@test.com',
      password: 'TestPassword123!',
      phone: '+966501234568', // Different number
      userType: 'BUSINESS'
    };

    console.log('🚀 Testing basic contractor registration...');
    console.log('Data:', testData);

    const response = await axios.post('http://127.0.0.1:3001/api/auth/contractor/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Basic Contractor Registration Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
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
testBasicContractorRegistration().then(success => {
  process.exit(success ? 0 : 1);
});