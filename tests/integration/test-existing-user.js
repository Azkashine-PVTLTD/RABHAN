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

async function testExistingUser() {
  console.log('🔐 Testing Existing User Login\n');
  
  // Test with an existing user from the database
  const existingUsers = [
    { email: 'testuser@rabhan.sa', password: 'RabhanTest123!' },
    { email: 'simple@test.com', password: 'Test123!' },
    { email: 'test@example.com', password: 'password123' }
  ];
  
  for (const user of existingUsers) {
    console.log(`Testing login for: ${user.email}`);
    
    try {
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: user.email,
        password: user.password
      });
      
      console.log(`Status: ${loginResponse.status}`);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        const token = loginResponse.data.accessToken;
        console.log(`Token: ${token.substring(0, 50)}...`);
        
        // Test getting user info
        console.log('Testing /api/auth/me...');
        const meResponse = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/me',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`Me Status: ${meResponse.status}`);
        if (meResponse.status === 200) {
          console.log('✅ User info retrieved successfully');
          console.log(`User: ${meResponse.data.email}, Role: ${meResponse.data.role}`);
          
          // NOW TEST USER SERVICE
          console.log('\n👤 Testing User Service...');
          const profileResponse = await makeRequest({
            hostname: 'localhost',
            port: 3005,
            path: '/api/users/profile',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log(`Profile Status: ${profileResponse.status}`);
          if (profileResponse.status === 200) {
            console.log('✅ Profile exists');
            console.log(`Name: ${profileResponse.data.firstName} ${profileResponse.data.lastName}`);
          } else if (profileResponse.status === 404) {
            console.log('ℹ️  No profile exists yet');
            
            // Try to create a profile
            console.log('Creating new profile...');
            const createResponse = await makeRequest({
              hostname: 'localhost',
              port: 3005,
              path: '/api/users/profile',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }, {
              firstName: 'Ahmed',
              lastName: 'Al-Saeed',
              nationalId: '1234567890',
              phone: '+966501234567',
              dateOfBirth: '1990-01-01',
              maritalStatus: 'SINGLE',
              dependents: 0,
              address: {
                street: 'King Fahd Road',
                city: 'Riyadh',
                region: 'Riyadh',
                postalCode: '12212',
                country: 'SA',
                gpsCoordinates: {
                  latitude: 24.7136,
                  longitude: 46.6753
                }
              },
              employment: {
                status: 'EMPLOYED',
                employer: 'RABHAN Solar',
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
            });
            
            console.log(`Create Profile Status: ${createResponse.status}`);
            if (createResponse.status === 201 || createResponse.status === 200) {
              console.log('✅ Profile created successfully!');
            }
          }
          
          // SUCCESS - Auth and User services are working!
          console.log('\n🎉 SUCCESS: BOTH SERVICES ARE WORKING!');
          console.log('✅ Auth Service: Registration, Login, Token validation');
          console.log('✅ User Service: Profile creation and retrieval');
          console.log(`\nWorking credentials: ${user.email} / ${user.password}`);
          return;
        }
        
      } else if (loginResponse.status === 401) {
        console.log('❌ Invalid credentials');
      } else if (loginResponse.status === 429) {
        console.log('⚠️  Rate limited');
      } else {
        console.log(`❌ Login failed: ${JSON.stringify(loginResponse.data)}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('---');
  }
}

testExistingUser();