const axios = require('axios');

async function testContractorLogin() {
  try {
    console.log('🔑 Testing contractor login...');
    
    const loginResponse = await axios.post('http://127.0.0.1:3001/api/auth/login', {
      email: 'basic-contractor@test.com',
      password: 'TestPassword123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Contractor Login Success!');
    console.log('Full Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.data && loginResponse.data.data.user) {
      console.log('User Role:', loginResponse.data.data.user.role);
      console.log('User Type:', loginResponse.data.data.user.user_type);
      console.log('User Status:', loginResponse.data.data.user.status);
    }
    
    return true;

  } catch (error) {
    console.error('❌ Contractor Login Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

testContractorLogin().then(success => {
  process.exit(success ? 0 : 1);
});