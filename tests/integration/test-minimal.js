const http = require('http');

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function testMinimal() {
  console.log('Testing minimal auth scenarios...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const health = await makeRequest('GET', '/health');
    console.log('Health:', health.status, health.data);
    
    // Test 2: Try without required fields
    console.log('\n2. Empty registration...');
    const empty = await makeRequest('POST', '/api/auth/register', {});
    console.log('Empty:', empty.status, empty.data);
    
    // Test 3: Minimal required fields only
    console.log('\n3. Minimal registration...');
    const minimal = await makeRequest('POST', '/api/auth/register', {
      email: 'minimal@test.com',
      password: 'Test123!',
      role: 'USER'
    });
    console.log('Minimal:', minimal.status, minimal.data);
    
    // Test 4: With all fields but simple values
    console.log('\n4. Complete simple registration...');
    const complete = await makeRequest('POST', '/api/auth/register', {
      email: 'complete@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+966501234567',
      nationalId: '1234567890',
      role: 'USER'
    });
    console.log('Complete:', complete.status, complete.data);
    
    // Test 5: Check if there are any other endpoints that work
    console.log('\n5. Check available endpoints...');
    
    // Try login endpoint
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    console.log('Login attempt:', login.status, login.data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMinimal();