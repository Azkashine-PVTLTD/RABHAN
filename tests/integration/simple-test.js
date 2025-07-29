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
  console.log('Testing Auth Service...');
  
  try {
    // Test health endpoint first
    const healthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('Health check:', healthResponse);
    
    // Test registration
    const registerOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const userData = {
      email: 'test@example.com',
      password: 'Test@123456',
      firstName: 'أحمد',
      lastName: 'السعيد',
      phone: '+966501234567',
      nationalId: '1234567890',
      role: 'USER'
    };
    
    const registerResponse = await makeRequest(registerOptions, userData);
    console.log('Register response:', registerResponse);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();