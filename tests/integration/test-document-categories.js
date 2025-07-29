/**
 * Test Script to Check Document Categories
 * This script tests if document categories are properly set up in the database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api/documents'; // Document service port

async function testDocumentCategories() {
  console.log('🔍 Testing Document Categories Setup\n');
  console.log('='*50);

  try {
    // Check if document service is running
    console.log('1. Checking document service health...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Document service is running');
      console.log('✅ Status:', healthCheck.data.status);
    } catch (error) {
      console.log('❌ Document service is not running. Please start it:');
      console.log('   cd E:\\RABHAN\\backend\\services\\document-service');
      console.log('   npm run dev');
      return;
    }

    // Get categories
    console.log('\n2. Fetching document categories...');
    const response = await axios.get(`${BASE_URL}/categories`);
    
    if (response.data.success) {
      const categories = response.data.categories;
      console.log('✅ Categories fetched successfully');
      console.log(`✅ Total categories: ${categories.length}\n`);

      console.log('📋 Category Details:');
      console.log('-'.repeat(80));
      
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name.toUpperCase()}`);
        console.log(`   Description: ${category.description}`);
        console.log(`   User Type: ${category.user_type}`);
        console.log(`   Required for KYC: ${category.required_for_kyc ? '✅ YES' : '❌ NO'}`);
        console.log(`   Max File Size: ${category.max_file_size_mb}MB`);
        console.log(`   Allowed Formats: ${category.allowed_formats.join(', ')}`);
        console.log();
      });

      // Filter required categories
      console.log('🎯 Required KYC Categories:');
      console.log('-'.repeat(40));
      
      const requiredCategories = categories.filter(cat => cat.required_for_kyc);
      
      if (requiredCategories.length === 0) {
        console.log('❌ NO REQUIRED CATEGORIES FOUND - This is the problem!');
        console.log('   All categories have required_for_kyc: false');
        console.log('   The frontend filter removes all categories');
      } else {
        console.log(`✅ Found ${requiredCategories.length} required categories:`);
        requiredCategories.forEach((category, index) => {
          console.log(`   ${index + 1}. ${category.name} (${category.user_type})`);
        });
      }

      // Filter by user type
      console.log('\n👤 Categories by User Type:');
      console.log('-'.repeat(40));
      
      const userCategories = categories.filter(cat => cat.user_type === 'USER' || cat.user_type === 'BOTH');
      const contractorCategories = categories.filter(cat => cat.user_type === 'CONTRACTOR' || cat.user_type === 'BOTH');
      
      console.log(`USER categories: ${userCategories.length}`);
      userCategories.forEach(cat => console.log(`   • ${cat.name} (required: ${cat.required_for_kyc})`));
      
      console.log(`\nCONTRACTOR categories: ${contractorCategories.length}`);
      contractorCategories.forEach(cat => console.log(`   • ${cat.name} (required: ${cat.required_for_kyc})`));

    } else {
      console.log('❌ Failed to fetch categories:', response.data.error);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.error);
    }
  }
}

async function main() {
  console.log('🚀 RABHAN Document Service - Categories Testing\n');
  
  await testDocumentCategories();
  
  console.log('\n' + '='*50);
  console.log('💡 If no required categories are found:');
  console.log('   1. The database might not be initialized');
  console.log('   2. Run: node E:\\RABHAN\\backend\\services\\document-service\\scripts\\setup-database.js');
  console.log('   3. Or the mapping in document.controller.ts is wrong');
}

main().catch(console.error);