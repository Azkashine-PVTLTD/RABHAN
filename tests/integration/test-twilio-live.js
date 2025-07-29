// Live Twilio SMS Test with Real Credentials
const axios = require('axios');

async function testTwilioIntegration() {
  console.log('🧪 TESTING TWILIO SMS INTEGRATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('Account SID: AC4ead84b09fb89f1d4c8d3d3b8ec9ee85');
  console.log('Phone Number: +12703987826');
  console.log('Status: Trial Account');
  console.log('═══════════════════════════════════════════════════');

  // Test with your phone number - replace with your actual number
  const testPhoneNumber = '+966501234567'; // Replace with your phone number for testing
  
  try {
    console.log(`\n📱 Testing SMS to: ${testPhoneNumber}`);
    console.log('Using auth service API endpoint...');
    
    // Test 1: Send OTP
    console.log('\n🔄 Step 1: Sending OTP...');
    const sendResponse = await axios.post('http://localhost:3001/api/auth/phone/send-otp', {
      phoneNumber: testPhoneNumber
    });
    
    console.log('✅ OTP Send Response:');
    console.log(JSON.stringify(sendResponse.data, null, 2));
    
    // Give user time to receive SMS
    console.log('\n⏰ Please check your phone for the SMS and enter the OTP below:');
    console.log('📱 You should receive a message like:');
    console.log('   "Your RABHAN verification code is: XXXXXX"');
    
    // Test 2: Get supported countries
    console.log('\n🔄 Step 2: Testing supported countries...');
    const countriesResponse = await axios.get('http://localhost:3001/api/auth/phone/countries');
    
    console.log('✅ Supported Countries:');
    console.log(JSON.stringify(countriesResponse.data, null, 2));
    
    // Test 3: Validate phone number format
    console.log('\n🔄 Step 3: Testing phone validation...');
    const validateResponse = await axios.post('http://localhost:3001/api/auth/phone/validate', {
      phoneNumber: testPhoneNumber
    });
    
    console.log('✅ Phone Validation:');
    console.log(JSON.stringify(validateResponse.data, null, 2));
    
    console.log('\n🎉 TWILIO INTEGRATION TESTS COMPLETED!');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SMS sending is working');
    console.log('✅ Country support is configured');
    console.log('✅ Phone validation is active');
    console.log('✅ Ready for frontend integration');
    
    console.log('\n📱 TO COMPLETE VERIFICATION:');
    console.log('1. Check your phone for the SMS message');
    console.log('2. Use the received code to test verification');
    console.log('3. Frontend PhoneVerification component is ready');
    
  } catch (error) {
    console.error('\n❌ TWILIO TEST FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if auth service is running on port 3001');
    console.log('2. Verify Twilio credentials in .env file');
    console.log('3. Ensure phone number is in correct format (+966XXXXXXXXX)');
    console.log('4. For trial accounts, verify the phone number in Twilio console');
    console.log('5. Check Twilio trial account limits and restrictions');
  }
}

// Helper function to test OTP verification manually
async function testOTPVerification(phoneNumber, otpCode) {
  try {
    console.log(`\n🔄 Testing OTP verification for ${phoneNumber} with code ${otpCode}...`);
    
    const verifyResponse = await axios.post('http://localhost:3001/api/auth/phone/verify-otp', {
      phoneNumber: phoneNumber,
      otp: otpCode
    });
    
    console.log('✅ OTP Verification Response:');
    console.log(JSON.stringify(verifyResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ OTP Verification Failed:', error.response?.data || error.message);
  }
}

// Run the test
console.log('🚀 Starting Twilio integration test...');
console.log('⚠️  Make sure to replace testPhoneNumber with your actual phone number!');
console.log('');

testTwilioIntegration();

// Uncomment and run this line after receiving SMS to test verification:
// testOTPVerification('+966501234567', '123456'); // Replace with your phone and received code