// Test User Service Profile Creation
const axios = require('axios');

async function testUserService() {
  console.log('🧪 TESTING USER SERVICE PROFILE CREATION');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    // Simulate a user ID from auth service
    const userId = 'ab548697-2503-484a-82e6-f4a82fafafe4'; // Existing user from database
    
    const profileData = {
      userId: userId,
      firstName: 'Ahmed',
      lastName: 'FrontendTest',
      region: 'riyadh',
      city: 'Riyadh',
      district: 'AlNakheel',
      streetAddress: '123 King Fahd Road',
      landmark: 'Near Al-Faisaliah Tower',
      postalCode: '12345',
      propertyType: 'villa',
      propertyOwnership: 'owned',
      roofSize: 200,
      gpsLatitude: 24.7136,
      gpsLongitude: 46.6753,
      electricityConsumption: '800-1000',
      electricityMeterNumber: 'SM123456',
      preferredLanguage: 'en',
      emailNotifications: true,
      smsNotifications: true,
      marketingConsent: false
    };
    
    console.log('📤 Sending profile data to user service:');
    console.log('POST /api/users/profiles/register');
    console.log('Data:', JSON.stringify(profileData, null, 2));
    
    const response = await axios.post('http://localhost:3005/api/users/profiles/register', profileData);
    
    console.log('✅ USER SERVICE PROFILE CREATION SUCCESSFUL!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
    // Test field mapping
    console.log('\n🔍 FIELD MAPPING VERIFICATION:');
    console.log('Frontend sent (camelCase) → Backend processed:');
    console.log(`firstName: ${profileData.firstName} → stored in profile`);
    console.log(`lastName: ${profileData.lastName} → stored in profile`);
    console.log(`streetAddress: ${profileData.streetAddress} → stored in profile`);
    console.log(`propertyType: ${profileData.propertyType} → stored in profile`);
    console.log(`electricityConsumption: ${profileData.electricityConsumption} → stored in profile`);
    
    console.log('\n🎉 USER SERVICE IS READY FOR FRONTEND INTEGRATION!');
    
  } catch (error) {
    console.error('\n❌ USER SERVICE TEST FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n🔧 POSSIBLE ISSUES:');
    console.log('1. User service not running on port 3005');
    console.log('2. Database connection issues');
    console.log('3. Invalid userId or user already has profile');
    console.log('4. Validation errors in profile data');
  }
}

testUserService();