const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function testDocumentUploadV3() {
  try {
    console.log('🧪 Testing document upload API v3...');
    
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
    const testImagePath = path.join(__dirname, 'test-national-id.png');
    fs.writeFileSync(testImagePath, pngBuffer);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-national-id.png',
      contentType: 'image/png'
    });
    
    // Use UUID format for user ID and correct category ID for National ID
    const testUserId = uuidv4(); // Generate a UUID for testing
    const nationalIdCategoryId = '99655c95-616f-4f28-8b4d-84b683b23642'; // National ID category from database
    
    form.append('userId', testUserId);
    form.append('categoryId', nationalIdCategoryId);
    
    console.log('📤 Testing upload with proper format...');
    console.log('🆔 User ID:', testUserId);
    console.log('📁 Category ID:', nationalIdCategoryId);
    
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
    
    // Clean up
    fs.unlinkSync(testImagePath);
    
    if (uploadResponse.status === 200) {
      console.log('✅ Upload test passed!');
    } else {
      console.log('❌ Upload test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDocumentUploadV3();