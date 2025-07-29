// Simple document upload test with detailed error logging
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSimpleUpload() {
  try {
    console.log('=== SIMPLE DOCUMENT UPLOAD TEST ===\n');

    // Step 1: Get a JWT token first
    console.log('1. Getting JWT token...');
    const authResponse = await axios.post('http://localhost:3001/api/auth/register', {
      first_name: 'Test',
      last_name: 'Upload',
      email: `upload.${Date.now()}@rabhan.sa`,
      password: 'SecurePass123!',
      phone: '+966501234567',
      national_id: `1${Date.now().toString().slice(-9)}`,
      user_type: 'HOMEOWNER'
    });

    const token = authResponse.data.data.accessToken;
    const userId = authResponse.data.data.user.id;
    console.log('✅ JWT token obtained');

    // Step 2: Test health check
    console.log('\n2. Testing document service health...');
    const healthResponse = await axios.get('http://localhost:3003/health');
    console.log('✅ Document service is healthy');

    // Step 3: Try uploading national ID
    console.log('\n3. Uploading National ID...');
    try {
      const nationalIdPath = 'E:/RABHAN/DOCS/national_id.jpeg';
      if (!fs.existsSync(nationalIdPath)) {
        console.log('❌ National ID file not found at:', nationalIdPath);
        return;
      }
      
      const nationalIdBuffer = fs.readFileSync(nationalIdPath);
      console.log('   File size:', nationalIdBuffer.length, 'bytes');
      
      const formData = new FormData();
      formData.append('file', nationalIdBuffer, 'national_id.jpeg');
      formData.append('userId', userId);
      formData.append('categoryId', 'national_id');

      const uploadResponse = await axios.post(
        'http://localhost:3003/api/documents/upload',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Upload successful!');
      console.log('   Response:', JSON.stringify(uploadResponse.data, null, 2));
      
    } catch (uploadError) {
      console.log('❌ Upload failed with detailed error:');
      if (uploadError.response) {
        console.log('   Status:', uploadError.response.status);
        console.log('   Headers:', uploadError.response.headers);
        console.log('   Data:', JSON.stringify(uploadError.response.data, null, 2));
      } else if (uploadError.request) {
        console.log('   No response received');
        console.log('   Request details:', uploadError.message);
      } else {
        console.log('   Error:', uploadError.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Test setup failed:');
    console.error('   Error:', error.response?.data || error.message);
  }
}

testSimpleUpload();