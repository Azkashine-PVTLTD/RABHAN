const { DatabaseConfig } = require('./backend/services/document-service/src/config/database.config');

async function checkCategories() {
  console.log('🔍 Checking Document Categories in Database');
  console.log('==========================================\n');
  
  try {
    const db = DatabaseConfig.getInstance();
    const result = await db.query('SELECT id, name, required_for_role FROM document_categories ORDER BY name');
    
    console.log('Current categories:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.required_for_role}`);
    });
    
    console.log('\n📋 Expected separation per Beta V2 spec:');
    console.log('USER (End Customer) Documents:');
    console.log('  - National ID');
    console.log('  - Address Proof');
    console.log('  - Income Proof (optional)');
    
    console.log('\nCONTRACTOR/VENDOR Documents:');
    console.log('  - Commercial Registration (C.R)');
    console.log('  - VAT Certificate');
    console.log('  - SASO Certificate');
    console.log('  - SEC License (Saudi Electricity Company)');
    console.log('  - Energy Authority Certificate');
    console.log('  - IBAN Verification');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();