const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDocumentUploadV2() {
  try {
    console.log('🧪 Testing document upload API v2...');
    
    // Test upload with proper form data structure
    const form = new FormData();
    
    // Create a simple image file (1x1 pixel PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0xD6, 0x2E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Write test image
    const testImagePath = path.join(__dirname, 'test-id.png');
    fs.writeFileSync(testImagePath, pngBuffer);
    
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-national-id.png',
      contentType: 'image/png'
    });
    form.append('userId', 'test-user-123');
    form.append('categoryId', 'national_id_front');
    
    console.log('📤 Testing upload with proper PNG file...');
    const uploadResponse = await fetch('http://localhost:3003/api/documents/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });
    
    console.log('📥 Upload response status:', uploadResponse.status);
    const responseText = await uploadResponse.text();
    console.log('📄 Response:', responseText);
    
    // Test categories endpoint
    console.log('\\n📋 Testing categories endpoint...');
    const categoriesResponse = await fetch('http://localhost:3003/api/documents/categories/list', {
      headers: {
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });
    
    console.log('📥 Categories response status:', categoriesResponse.status);
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('📋 Available categories:', JSON.stringify(categoriesData, null, 2));
    } else {
      const errorText = await categoriesResponse.text();
      console.log('❌ Categories error:', errorText);
    }
    
    // Clean up
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDocumentUploadV2();