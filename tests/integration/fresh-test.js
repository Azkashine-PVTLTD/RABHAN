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

async function testWithFreshUser() {
  console.log('🚀 RABHAN API Test with Fresh User\n');
  
  // Generate a unique email for this test
  const timestamp = Date.now();
  const userData = {
    email: `test${timestamp}@rabhan.sa`,
    password: 'RabhanTest123!',
    firstName: 'Ahmed',
    lastName: 'Al-Saeed',
    phone: '+966501234567',
    nationalId: '1234567890',
    role: 'USER'
  };
  
  console.log('Using fresh email:', userData.email);
  
  try {
    // 1. Register
    console.log('\n1. Registering fresh user...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, userData);
    
    console.log('Register Status:', registerResponse.status);
    
    if (registerResponse.status === 201) {
      console.log('✅ Registration successful!');
      console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
      
      // Extract tokens if available
      const accessToken = registerResponse.data.data?.accessToken || registerResponse.data.accessToken;
      
      if (accessToken) {
        console.log('✅ Auth token received:', accessToken.substring(0, 50) + '...');
        
        // Test authenticated endpoint
        console.log('\n2. Testing authenticated endpoint...');
        const meResponse = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/me',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        console.log('Me Status:', meResponse.status);
        console.log('Me Response:', JSON.stringify(meResponse.data, null, 2));
        
        if (meResponse.status === 200) {
          console.log('✅ Token validation successful!');
          
          // Test user service
          console.log('\n3. Testing User Service...');
          const profileData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            nationalId: userData.nationalId,
            phone: userData.phone,
            dateOfBirth: '1990-01-01',
            maritalStatus: 'SINGLE',
            dependents: 0,
            address: {
              street: 'Prince Mohammed Bin Abdulaziz Road',
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
              employer: 'RABHAN Solar Solutions',
              position: 'Software Engineer',
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
            port: 3005,
            path: '/api/users/profile',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          }, profileData);
          
          console.log('Profile Status:', profileResponse.status);
          console.log('Profile Response:', JSON.stringify(profileResponse.data, null, 2));
          
          if (profileResponse.status === 201 || profileResponse.status === 200) {
            console.log('✅ User profile created successfully!');
            
            console.log('\n=== 🎉 SUCCESS SUMMARY ===');
            console.log('✅ Auth Service: WORKING');
            console.log('✅ User Service: WORKING');
            console.log('✅ Complete user creation flow: SUCCESS');
            
            console.log('\n📋 Test Results:');
            console.log('Email:', userData.email);
            console.log('Password:', userData.password);
            console.log('Auth Token:', accessToken.substring(0, 30) + '...');
            console.log('Profile Created: YES');
            
          } else {
            console.log('❌ Profile creation failed');
          }
        }
      } else {
        console.log('❌ No auth token in registration response');
      }
      
    } else if (registerResponse.status === 400) {
      console.log('❌ Validation error:');
      console.log(JSON.stringify(registerResponse.data, null, 2));
    } else {
      console.log('❌ Registration failed:');
      console.log(JSON.stringify(registerResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testWithFreshUser();