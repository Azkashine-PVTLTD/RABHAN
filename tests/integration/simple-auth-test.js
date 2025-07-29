const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuth() {
  console.log('Testing Auth Service with Minimal Data...\n');
  
  try {
    // Very simple user data
    const userData = {
      email: 'simple@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+966501234567',
      nationalId: '1234567890',
      role: 'USER'
    };
    
    console.log('1. Trying registration...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, userData);
    
    console.log('Status:', registerResponse.status);
    console.log('Response:', registerResponse.data);
    
    if (registerResponse.status !== 201 && registerResponse.status !== 409) {
      console.log('\n2. Trying even simpler data...');
      
      const simpleData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'USER'
      };
      
      const simpleResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, simpleData);
      
      console.log('Simple Status:', simpleResponse.status);
      console.log('Simple Response:', simpleResponse.data);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();