const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
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

async function testCompleteFlow() {
  console.log('🚀 Testing Complete RABHAN API Flow\n');
  
  let authToken = '';
  let userId = '';
  
  try {
    // 1. Test Auth Service Health
    console.log('1. Testing Auth Service Health...');
    const authHealth = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Auth Service Health:', authHealth.status === 200 ? 'OK' : 'FAILED');
    console.log('Response:', authHealth.data);
    
    // 2. Test User Service Health  
    console.log('\n2. Testing User Service Health...');
    const userHealth = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ User Service Health:', userHealth.status === 200 ? 'OK' : 'FAILED');
    console.log('Response:', userHealth.data);
    
    // 3. Test Document Service Health
    console.log('\n3. Testing Document Service Health...');
    const docHealth = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/health',
      method: 'GET'
    });
    console.log('✅ Document Service Health:', docHealth.status === 200 ? 'OK' : 'FAILED');
    console.log('Response:', docHealth.data);
    
    // 4. Register User (using simpler data first)
    console.log('\n4. Registering User...');
    const userData = {
      email: 'test2@example.com',
      password: 'Test@123456',
      firstName: 'Ahmad',
      lastName: 'AlSaeed',
      phone: '+966501234567',
      nationalId: '1234567890',
      role: 'USER'
    };
    
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, userData);
    
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ Registration successful');
      
      // 5. Login
      console.log('\n5. Logging in...');
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        email: userData.email,
        password: userData.password
      });
      
      console.log('Login Status:', loginResponse.status);
      console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.status === 200 && loginResponse.data.accessToken) {
        authToken = loginResponse.data.accessToken;
        userId = loginResponse.data.user?.id;
        console.log('✅ Login successful');
        console.log('Auth Token:', authToken.substring(0, 50) + '...');
        
        // 6. Get Current User
        console.log('\n6. Getting current user...');
        const meResponse = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log('Me Status:', meResponse.status);
        console.log('Me Response:', JSON.stringify(meResponse.data, null, 2));
        
        if (meResponse.status === 200) {
          console.log('✅ User info retrieved successfully');
          
          // 7. Test User Service - Create Profile
          console.log('\n7. Creating user profile...');
          const profileData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            nationalId: userData.nationalId,
            phone: userData.phone,
            dateOfBirth: '1990-01-01',
            maritalStatus: 'SINGLE',
            dependents: 0,
            address: {
              street: 'King Fahd Road',
              city: 'Riyadh',
              region: 'Riyadh',
              postalCode: '12211',
              country: 'SA',
              gpsCoordinates: {
                latitude: 24.7136,
                longitude: 46.6753
              }
            },
            employment: {
              status: 'EMPLOYED',
              employer: 'Solar Energy Company',
              position: 'Engineer',
              monthlyIncome: 15000,
              yearsEmployed: 3
            },
            monthlyElectricityBill: 500,
            roofSpaceAvailable: 150,
            preferences: {
              language: 'ar',
              currency: 'SAR',
              notifications: {
                email: true,
                sms: true,
                push: true
              }
            }
          };
          
          const profileResponse = await makeRequest({
            hostname: 'localhost',
            port: 3003,
            path: '/api/users/profile',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          }, profileData);
          
          console.log('Profile Status:', profileResponse.status);
          console.log('Profile Response:', JSON.stringify(profileResponse.data, null, 2));
          
          if (profileResponse.status === 201 || profileResponse.status === 200) {
            console.log('✅ Profile created successfully');
            
            // 8. Get Profile
            console.log('\n8. Getting user profile...');
            const getProfileResponse = await makeRequest({
              hostname: 'localhost',
              port: 3003,
              path: '/api/users/profile',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            console.log('Get Profile Status:', getProfileResponse.status);
            console.log('Get Profile Response:', JSON.stringify(getProfileResponse.data, null, 2));
            
            if (getProfileResponse.status === 200) {
              console.log('✅ Profile retrieved successfully');
            }
          }
        }
      }
    } else if (registerResponse.status === 409) {
      console.log('⚠️  User already exists, trying to login...');
      
      // Try login with existing user
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.status === 200 && loginResponse.data.accessToken) {
        authToken = loginResponse.data.accessToken;
        console.log('✅ Login with existing user successful');
        console.log('Auth Token:', authToken.substring(0, 50) + '...');
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Auth Service: ' + (authHealth.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('User Service: ' + (userHealth.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('Document Service: ' + (docHealth.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('Authentication: ' + (authToken ? '✅ Working' : '❌ Failed'));
    
    if (authToken) {
      console.log('\nTest User Credentials:');
      console.log('Email:', userData.email);
      console.log('Password:', userData.password);
      console.log('Auth Token:', authToken.substring(0, 50) + '...');
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Wait a bit for services to be ready
setTimeout(() => {
  testCompleteFlow();
}, 2000);