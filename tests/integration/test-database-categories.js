const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rabhan_document',
  user: 'postgres',
  password: '12345'
});

async function testDatabaseCategories() {
  try {
    console.log('🗄️ Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Get all categories
    const categoriesResult = await client.query(`
      SELECT id, name, description, required_for_role, is_active 
      FROM document_categories 
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log('📋 Available document categories:');
    categoriesResult.rows.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.id})`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Role: ${category.required_for_role}`);
      console.log('');
    });
    
    // Check if our specific categories exist
    const kycCategories = ['national_id', 'salary_certificate', 'bank_statement'];
    console.log('🔍 Checking for KYC categories:');
    
    for (const categoryName of kycCategories) {
      const result = await client.query(
        'SELECT id, name FROM document_categories WHERE name = $1 AND is_active = true',
        [categoryName]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ ${categoryName}: ${result.rows[0].id}`);
      } else {
        console.log(`❌ ${categoryName}: Not found`);
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseCategories();