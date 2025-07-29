const axios = require('axios');

async function testDocumentEndpoints() {
  console.log('Testing Document Service Endpoints...\n');
  
  const baseURL = 'http://localhost:3003/api/documents';
  const headers = {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health/status`, { headers });
    console.log('✅ Health Status:', healthResponse.data);
    
    // Test 2: Get categories
    console.log('\n2. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${baseURL}/categories/list`, { headers });
    console.log('✅ Categories Response Structure:', {
      success: categoriesResponse.data.success,
      dataType: typeof categoriesResponse.data.data,
      dataLength: Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data.length : 'not array',
      firstCategory: categoriesResponse.data.data?.[0] || 'none'
    });
    
    // Test 3: Get documents (list)
    console.log('\n3. Testing documents list endpoint...');
    const documentsResponse = await axios.get(`${baseURL}/`, { headers });
    console.log('✅ Documents Response Structure:', {
      success: documentsResponse.data.success,
      dataType: typeof documentsResponse.data.data,
      dataLength: Array.isArray(documentsResponse.data.data) ? documentsResponse.data.data.length : 'not array',
      pagination: documentsResponse.data.pagination
    });
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

testDocumentEndpoints();