#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testDocumentReplacement() {
  console.log('🧪 Testing Document Replacement Logic');
  console.log('=====================================\n');

  const baseURL = 'http://localhost:3003/api/documents';
  const userId = '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0';
  const nationalIdCategoryId = '99655c95-616f-4f28-8b4d-84b683b23642';

  try {
    // 1. Check current documents before upload
    console.log('1. Checking documents before replacement...');
    const beforeResponse = await axios.get(`${baseURL}/?userId=${userId}`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const nationalIdDocsBefore = beforeResponse.data.documents.filter(
      doc => doc.category_id === nationalIdCategoryId
    );
    
    console.log(`   📊 National ID documents before: ${nationalIdDocsBefore.length}`);
    nationalIdDocsBefore.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.original_filename} (${doc.document_id})`);
    });

    // 2. Create a test PNG file to upload (minimal valid PNG)
    console.log('\n2. Creating test replacement document...');
    const testFileName = 'replacement_national_id.png';
    // Create a minimal valid PNG file (1x1 pixel transparent PNG)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testFileName, pngData);
    
    // 3. Upload replacement document
    console.log('\n3. Uploading replacement document...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFileName));
    formData.append('userId', userId);
    formData.append('categoryId', nationalIdCategoryId);
    formData.append('metadata', JSON.stringify({ test: true, replacement: true }));

    const uploadResponse = await axios.post(`${baseURL}/upload`, formData, {
      headers: {
        'Authorization': 'Bearer test-token',
        ...formData.getHeaders()
      }
    });

    if (uploadResponse.data.success) {
      console.log('   ✅ Document uploaded successfully');
      console.log(`   📄 New document ID: ${uploadResponse.data.document_id}`);
    } else {
      console.log('   ❌ Upload failed:', uploadResponse.data.error);
      return;
    }

    // 4. Wait a moment for cleanup to complete
    console.log('\n4. Waiting for cleanup to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Check documents after replacement
    console.log('\n5. Checking documents after replacement...');
    const afterResponse = await axios.get(`${baseURL}/?userId=${userId}`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const nationalIdDocsAfter = afterResponse.data.documents.filter(
      doc => doc.category_id === nationalIdCategoryId
    );
    
    console.log(`   📊 National ID documents after: ${nationalIdDocsAfter.length}`);
    nationalIdDocsAfter.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.original_filename} (${doc.document_id})`);
    });

    // 6. Verify replacement worked correctly
    console.log('\n6. Verification results:');
    if (nationalIdDocsAfter.length === 1) {
      console.log('   ✅ SUCCESS: Only 1 document per category (as expected)');
      console.log('   ✅ Old duplicate documents were automatically removed');
      console.log('   ✅ KYC business rule enforced: 1 document per category');
    } else {
      console.log(`   ❌ FAILED: Still have ${nationalIdDocsAfter.length} documents in National ID category`);
      console.log('   ❌ Document replacement logic needs debugging');
    }

    // Cleanup test file
    try {
      fs.unlinkSync(testFileName);
    } catch {}

    console.log('\n🎉 Document replacement test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response headers:', error.response.headers);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('   Full error:', error.stack);
    
    // Cleanup test file if it exists
    try {
      fs.unlinkSync('replacement_national_id.png');
    } catch {}
  }
}

testDocumentReplacement();