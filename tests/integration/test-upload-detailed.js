const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function testDetailedUpload() {
  try {
    console.log('🧪 Testing detailed document upload...');
    
    // Create test file
    const testContent = 'PNG test file content';
    const testFile = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFile, testContent);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile), {
      filename: 'test-national-id.txt',
      contentType: 'text/plain'
    });
    
    const testUserId = uuidv4();
    const nationalIdCategory = '99655c95-616f-4f28-8b4d-84b683b23642';
    
    form.append('userId', testUserId);
    form.append('categoryId', nationalIdCategory);
    
    console.log('📋 Form data being sent:');
    console.log('  userId:', testUserId);
    console.log('  categoryId:', nationalIdCategory);
    console.log('  file:', testFile);
    
    // Log the actual form data
    const formBuffer = form.getBuffer();
    console.log('📦 Form data buffer size:', formBuffer.length);
    console.log('📝 Form data preview:');
    console.log(formBuffer.toString('utf8').substring(0, 200) + '...');
    
    console.log('📤 Sending upload request...');
    
    const response = await fetch('http://localhost:3003/api/documents/upload', {
      method: 'POST',
      body: form
    });
    
    console.log('📥 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    // Clean up
    fs.unlinkSync(testFile);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDetailedUpload();