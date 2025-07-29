const { Pool } = require('pg');

async function checkDatabase() {
  console.log('🔍 Checking Document Categories in Database');
  console.log('==========================================\n');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres:12345@localhost:5432/rabhan_document'
  });
  
  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful\n');
    
    // Check if document_categories table exists
    console.log('2. Checking if document_categories table exists...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_categories'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ document_categories table does not exist\n');
      return;
    }
    console.log('✅ document_categories table exists\n');
    
    // Get all categories
    console.log('3. Current document categories:');
    const result = await pool.query(`
      SELECT id, name, description, required_for_role, 
             max_file_size_mb, allowed_formats, is_active
      FROM document_categories 
      ORDER BY required_for_role, name
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No document categories found in database\n');
    } else {
      console.log(`✅ Found ${result.rows.length} categories:\n`);
      result.rows.forEach(row => {
        console.log(`  📁 ${row.name}`);
        console.log(`     Description: ${row.description}`);
        console.log(`     Required for: ${row.required_for_role}`);
        console.log(`     Max size: ${row.max_file_size_mb}MB`);
        console.log(`     Formats: ${row.allowed_formats.join(', ')}`);
        console.log(`     Active: ${row.is_active ? 'Yes' : 'No'}`);
        console.log(`     ID: ${row.id}\n`);
      });
    }
    
    // Check for specific required categories
    console.log('4. Checking for required USER categories:');
    const userCategories = ['National ID', 'Address Proof', 'Income Proof'];
    for (const category of userCategories) {
      const exists = await pool.query(
        'SELECT COUNT(*) as count FROM document_categories WHERE name = $1 AND required_for_role IN ($2, $3)',
        [category, 'customer', 'both']
      );
      console.log(`   ${category}: ${exists.rows[0].count > 0 ? '✅ Found' : '❌ Missing'}`);
    }
    
    console.log('\n5. Checking for required CONTRACTOR categories:');
    const contractorCategories = ['Commercial Registration', 'VAT Certificate', 'SASO Certificate', 'SEC License', 'Energy Authority Certificate', 'IBAN Verification'];
    for (const category of contractorCategories) {
      const exists = await pool.query(
        'SELECT COUNT(*) as count FROM document_categories WHERE name = $1 AND required_for_role IN ($2, $3)',
        [category, 'contractor', 'both']
      );
      console.log(`   ${category}: ${exists.rows[0].count > 0 ? '✅ Found' : '❌ Missing'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

checkDatabase();