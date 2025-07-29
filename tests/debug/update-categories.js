#!/usr/bin/env node

const axios = require('axios');

async function updateDocumentCategories() {
  console.log('🔄 Fixing Document Categories According to Beta V2 Spec');
  console.log('===================================================\n');

  // Based on Beta V2 specification:
  // USER (End Customer): National ID, Address Proof
  // CONTRACTOR/VENDOR: C.R, VAT, SASO, SEC License, Energy Authority, IBAN
  
  const userCategories = ['National ID', 'Address Proof', 'Income Proof'];
  const contractorCategories = [
    'Commercial Registration', 
    'VAT Certificate', 
    'SASO Certificate', 
    'SEC License', 
    'Energy Authority Certificate', 
    'IBAN Verification'
  ];

  try {
    // Get current categories
    console.log('1. Getting current categories...');
    const response = await axios.get('http://localhost:3003/api/documents/categories/list', {
      headers: { 'Authorization': 'Bearer test-token' }
    });

    const categories = response.data.categories;
    console.log(`   Found ${categories.length} categories\n`);

    // Show current issue
    console.log('2. Current WRONG setup (all as BOTH):');
    categories.forEach(cat => {
      console.log(`   ${cat.name}: ${cat.user_type}`);
    });

    console.log('\n3. CORRECT setup per Beta V2 spec:');
    console.log('   USER Documents:');
    userCategories.forEach(name => {
      console.log(`   - ${name}: should be USER only`);
    });
    
    console.log('\n   CONTRACTOR Documents:');
    contractorCategories.forEach(name => {
      console.log(`   - ${name}: should be CONTRACTOR only`);
    });

    console.log('\n❌ CRITICAL ISSUE IDENTIFIED:');
    console.log('   • All categories are wrongly set as "BOTH"');
    console.log('   • Users see contractor documents (C.R, VAT, SASO, etc.)');
    console.log('   • Contractors see user documents (National ID, Address)');
    console.log('   • This violates Beta V2 business requirements!');

    console.log('\n✅ SOLUTION NEEDED:');
    console.log('   • Update database: required_for_role field per category');
    console.log('   • Frontend: Filter categories by user type');
    console.log('   • Separate KYC flows for Users vs Contractors');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateDocumentCategories();