const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testDocumentUpload() {
  try {
    console.log('🧪 Testing Document Upload Service...\n');
    
    // Check if document service is running
    try {
      const healthResponse = await axios.get('http://localhost:3003/health');
      console.log('✅ Document service health:', healthResponse.data.service);
    } catch (error) {
      console.error('❌ Document service not running:', error.message);
      return;
    }
    
    // Test: Get categories
    console.log('\n📋 Testing Categories Endpoint...');
    try {
      const categoriesResponse = await axios.get('http://localhost:3003/api/documents/categories/list', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Categories loaded:', categoriesResponse.data.categories.length, 'categories');
      
      // Find a user category for testing
      const userCategory = categoriesResponse.data.categories.find(cat => 
        cat.user_type === 'USER' && cat.allowed_formats.includes('png')
      );
      
      if (!userCategory) {
        console.error('❌ No suitable user category found for PNG upload');
        return;
      }
      
      console.log('🎯 Using category:', userCategory.name, '(' + userCategory.id + ')');
      
      // Create a test image file
      console.log('\n📁 Creating test image file...');
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      const testImagePath = './test-upload-image.png';
      fs.writeFileSync(testImagePath, pngBuffer);
      console.log('✅ Test image created');
      
      // Test: Upload document
      console.log('\n📤 Testing Document Upload...');
      const form = new FormData();
      form.append('file', fs.createReadStream(testImagePath));
      form.append('category_id', userCategory.id);
      form.append('description', 'Test document upload');
      
      const uploadResponse = await axios.post('http://localhost:3003/api/documents/upload', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer test-token'
        },
        timeout: 30000
      });
      
      console.log('✅ Upload successful!');
      console.log('Document ID:', uploadResponse.data.document?.document_id);
      
      // Clean up
      fs.unlinkSync(testImagePath);
      
    } catch (error) {
      console.error('❌ Test failed:');
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data || error.message);
      if (error.response && error.response.data) {
        console.error('Full response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testDocumentUpload();