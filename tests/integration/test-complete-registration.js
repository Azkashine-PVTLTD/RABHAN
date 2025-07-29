// Test complete registration flow with detailed error logging
const axios = require('axios');

async function testCompleteRegistration() {
  try {
    console.log('=== TESTING COMPLETE USER REGISTRATION FLOW ===\n');

    // Generate unique test data
    const timestamp = Date.now();
    const uniqueId = `1${timestamp.toString().slice(-9)}`;
    
    // Step 1: Register user with auth service
    console.log('1. Registering user with Auth Service...');
    const authData = {
      first_name: 'Test',
      last_name: 'User',
      email: `test.${timestamp}@rabhan.sa`,
      password: 'SecurePass123!',
      phone: '+966501234567',
      national_id: uniqueId,
      user_type: 'HOMEOWNER'
    };
    
    console.log('   Request data:', JSON.stringify(authData, null, 2));
    
    const authResponse = await axios.post('http://localhost:3001/api/auth/register', authData);

    console.log('✅ Auth Service - Registration successful');
    console.log('   User ID:', authResponse.data.data.user.id);
    console.log('   User Email:', authResponse.data.data.user.email);
    console.log('   User Status:', authResponse.data.data.user.status);
    console.log('   JWT Token:', authResponse.data.data.accessToken ? 'Received' : 'Not received');
    
    const token = authResponse.data.data.accessToken;
    const userId = authResponse.data.data.user.id;

    // Step 2: Check if user service is running
    console.log('\n2. Checking User Service availability...');
    try {
      await axios.get('http://localhost:3005/health');
      console.log('✅ User Service is running');
    } catch (error) {
      console.log('❌ User Service is NOT running');
      console.log('   Please start the user service with: cd backend/services/user-service && npm run dev');
      return;
    }

    // Step 3: Create user profile
    console.log('\n3. Creating user profile...');
    const profileData = {
      userId: userId,
      firstName: 'Test',
      lastName: 'User',
      region: 'riyadh',
      city: 'Riyadh',
      district: 'Al-Olaya',
      streetAddress: '123 Test Street',
      postalCode: '12345',
      propertyType: 'villa',
      propertyOwnership: 'owned',
      roofSize: 200,
      gpsLatitude: 24.7136,
      gpsLongitude: 46.6753,
      electricityConsumption: '1200_1500',
      electricityMeterNumber: 'SM123456',
      preferredLanguage: 'en'
    };
    
    console.log('   Request data:', JSON.stringify(profileData, null, 2));
    
    const userResponse = await axios.post(
      'http://localhost:3005/api/users/profiles/register',
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ User Service - Profile created successfully');
    console.log('   Profile ID:', userResponse.data.data.id);
    console.log('   BNPL Eligible:', userResponse.data.data.bnpl_eligible);
    console.log('   KYC Status:', userResponse.data.data.kyc_status);

    console.log('\n=== COMPLETE REGISTRATION SUCCESSFUL! ===');
    console.log('User has been registered in both Auth and User services');
    console.log('All microservices are properly integrated');

  } catch (error) {
    console.error('\n❌ Registration failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
      console.error('   URL:', error.config.url);
      console.error('   Method:', error.config.method);
    } else if (error.request) {
      console.error('   No response received');
      console.error('   URL:', error.config.url);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testCompleteRegistration();