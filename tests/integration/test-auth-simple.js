// Simple Auth Test
const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing auth registration with camelCase data...');
    
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      firstName: 'Test',
      lastName: 'User', 
      email: `test.${Date.now()}@example.com`,
      password: 'Test123!@#'
    });
    
    console.log('✅ Success!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
  }
}

testAuth();