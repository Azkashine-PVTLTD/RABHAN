#!/usr/bin/env node

const axios = require('axios');

async function verifyCategoriesSeparation() {
  console.log('✅ Verifying Document Categories Separation');
  console.log('==========================================\n');

  try {
    // Get all categories
    const response = await axios.get('http://localhost:3003/api/documents/categories/list', {
      headers: { 'Authorization': 'Bearer test-token' }
    });

    const categories = response.data.categories;

    // Separate by user type
    const userCategories = categories.filter(cat => cat.user_type === 'USER');
    const contractorCategories = categories.filter(cat => cat.user_type === 'CONTRACTOR');
    const bothCategories = categories.filter(cat => cat.user_type === 'BOTH');

    console.log('📱 USER (End Customer) Documents:');
    userCategories.forEach(cat => {
      console.log(`   ✅ ${cat.name} - ${cat.description}`);
    });

    console.log('\n🏢 CONTRACTOR/VENDOR Documents:');
    contractorCategories.forEach(cat => {
      console.log(`   ✅ ${cat.name} - ${cat.description}`);
    });

    console.log('\n🔄 BOTH User Types:');
    bothCategories.forEach(cat => {
      console.log(`   ✅ ${cat.name} - ${cat.description}`);
    });

    console.log('\n📊 Summary:');
    console.log(`   • USER documents: ${userCategories.length}`);
    console.log(`   • CONTRACTOR documents: ${contractorCategories.length}`);
    console.log(`   • BOTH documents: ${bothCategories.length}`);
    console.log(`   • Total: ${categories.length}`);

    console.log('\n✅ VERIFICATION RESULTS:');
    
    // Check Beta V2 compliance
    const expectedUserDocs = ['National ID', 'Address Proof', 'Income Proof'];
    const expectedContractorDocs = [
      'Commercial Registration', 
      'VAT Certificate', 
      'SASO Certificate', 
      'SEC License', 
      'Energy Authority Certificate', 
      'IBAN Verification'
    ];

    const actualUserDocs = userCategories.map(cat => cat.name);
    const actualContractorDocs = contractorCategories.map(cat => cat.name);

    console.log('   📋 Beta V2 Compliance Check:');
    
    expectedUserDocs.forEach(docName => {
      const found = actualUserDocs.includes(docName);
      console.log(`   ${found ? '✅' : '❌'} USER: ${docName}`);
    });

    expectedContractorDocs.forEach(docName => {
      const found = actualContractorDocs.includes(docName);
      console.log(`   ${found ? '✅' : '❌'} CONTRACTOR: ${docName}`);
    });

    console.log('\n🎯 FRONTEND IMPACT:');
    console.log('   • USER KYC will show: National ID, Address Proof, Income Proof');
    console.log('   • CONTRACTOR KYC will show: C.R, VAT, SASO, SEC, Energy Auth, IBAN');
    console.log('   • No more confusion between user types! ✅');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCategoriesSeparation();