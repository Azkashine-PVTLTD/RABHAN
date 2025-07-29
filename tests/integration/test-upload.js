const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('categoryId', '99655c95-616f-4f28-8b4d-84b683b23642');
    form.append('userId', '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0');
    form.append('metadata', JSON.stringify({userId: '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0'}));
    form.append('file', fs.createReadStream('E:\\RABHAN\\DOCS\\address.png'));

    const response = await fetch('http://localhost:3003/api/documents/upload', {
      method: 'POST',
      body: form,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36'
      }
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUpload();