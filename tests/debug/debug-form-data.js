const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function debugFormData() {
  try {
    console.log('🔍 Debugging form data...');
    
    // Create a simple test file
    const testContent = 'test file content';
    const testFilePath = path.join(__dirname, 'test-debug.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-debug.txt',
      contentType: 'text/plain'
    });
    form.append('userId', 'test-user-id');
    form.append('categoryId', 'test-category-id');
    
    console.log('📋 Form fields:');
    console.log('Headers:', form.getHeaders());
    
    // Manual inspection of form data
    const formBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      form.on('data', chunk => chunks.push(chunk));
      form.on('end', () => resolve(Buffer.concat(chunks)));
      form.on('error', reject);
    });
    
    console.log('📦 Form data size:', formBuffer.length);
    console.log('📝 Form data preview:', formBuffer.toString('utf8').substring(0, 500));
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFormData();