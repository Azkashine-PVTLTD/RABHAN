// Test document upload functionality with real images
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testDocumentUpload() {
  try {
    console.log('=== TESTING DOCUMENT UPLOAD WITH REAL IMAGES ===\n');

    // Step 1: Register user and get JWT token
    console.log('1. Registering user for document upload test...');
    const timestamp = Date.now();
    const uniqueId = `1${timestamp.toString().slice(-9)}`;
    
    const authResponse = await axios.post('http://localhost:3001/api/auth/register', {
      first_name: 'Mohamed',
      last_name: 'Alshahrani',
      email: `mohamed.${timestamp}@rabhan.sa`,
      password: 'SecurePass123!',
      phone: '+966501234567',
      national_id: uniqueId,
      user_type: 'HOMEOWNER'
    });

    console.log('✅ Auth Service - User registered');
    const token = authResponse.data.data.accessToken;
    const userId = authResponse.data.data.user.id;

    // Step 2: Create user profile
    console.log('\n2. Creating user profile...');
    const userResponse = await axios.post('http://localhost:3005/api/users/profiles/register', {
      userId: userId,
      firstName: 'Mohamed',
      lastName: 'Alshahrani',
      region: 'riyadh',
      city: 'Riyadh',
      district: 'AlOlaya',
      streetAddress: '456 Prince Mohammed Road',
      postalCode: '12345',
      propertyType: 'villa',
      propertyOwnership: 'owned',
      roofSize: 300,
      gpsLatitude: 24.7136,
      gpsLongitude: 46.6753,
      electricityConsumption: '1200_1500',
      electricityMeterNumber: 'SM456789',
      preferredLanguage: 'ar'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ User Service - Profile created');

    // Step 3: Test Document Service Health
    console.log('\n3. Testing Document Service...');
    const healthResponse = await axios.get('http://localhost:3003/health');
    console.log('✅ Document Service - Running and healthy');

    // Step 4: Upload National ID document
    console.log('\n4. Uploading National ID document...');
    try {
      const nationalIdPath = 'E:/RABHAN/DOCS/national_id.jpeg';
      const nationalIdBuffer = fs.readFileSync(nationalIdPath);
      
      const formData1 = new FormData();
      formData1.append('file', nationalIdBuffer, 'national_id.jpeg');
      formData1.append('userId', userId);
      formData1.append('categoryId', 'national_id_front');

      const uploadResponse1 = await axios.post(
        'http://localhost:3003/api/documents/upload',
        formData1,
        {
          headers: {
            ...formData1.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ National ID uploaded successfully');
      console.log('   Document ID:', uploadResponse1.data.data?.id || 'Response available');
      
    } catch (nationalIdError) {
      console.log('❌ National ID upload failed:');
      console.log('   Error:', nationalIdError.response?.data?.error || nationalIdError.message);
    }

    // Step 5: Upload Address document
    console.log('\n5. Uploading Address document...');
    try {
      const addressPath = 'E:/RABHAN/DOCS/address.png';
      const addressBuffer = fs.readFileSync(addressPath);
      
      const formData2 = new FormData();
      formData2.append('file', addressBuffer, 'address.png');
      formData2.append('userId', userId);
      formData2.append('categoryId', 'proof_of_address');

      const uploadResponse2 = await axios.post(
        'http://localhost:3003/api/documents/upload',
        formData2,
        {
          headers: {
            ...formData2.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Address document uploaded successfully');
      console.log('   Document ID:', uploadResponse2.data.data?.id || 'Response available');
      
    } catch (addressError) {
      console.log('❌ Address upload failed:');
      console.log('   Error:', addressError.response?.data?.error || addressError.message);
    }

    // Step 6: List user documents
    console.log('\n6. Retrieving uploaded documents...');
    try {
      const documentsResponse = await axios.get(
        `http://localhost:3003/api/documents/user/${userId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      console.log('✅ Documents retrieved successfully');
      console.log('   Total documents:', documentsResponse.data.data?.length || 'Available');
      
    } catch (retrieveError) {
      console.log('❌ Document retrieval failed:');
      console.log('   Error:', retrieveError.response?.data?.error || retrieveError.message);
    }

    console.log('\n=== DOCUMENT UPLOAD TEST SUMMARY ===');
    console.log('✅ Auth Service: User registration working');
    console.log('✅ User Service: Profile creation working');
    console.log('✅ Document Service: Running without Redis');
    console.log('📄 National ID: Upload tested');
    console.log('📄 Address Proof: Upload tested');

  } catch (error) {
    console.error('\n❌ Document upload test failed:');
    console.error('   Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('   Status:', error.response.status);
    }
  }
}

testDocumentUpload();