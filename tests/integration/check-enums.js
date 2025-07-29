const { Pool } = require('pg');

async function checkEnums() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_user',
    password: '12345',
    port: 5432,
  });

  try {
    // Check property_type enum values
    const result = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'property_type_enum')
      ORDER BY enumsortorder
    `);
    
    console.log('Available property_type values:');
    result.rows.forEach(row => {
      console.log(`   "${row.enumlabel}"`);
    });
    
    // Check electricity_consumption enum values
    const result2 = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'consumption_range_enum')
      ORDER BY enumsortorder
    `);
    
    console.log('\nAvailable electricity_consumption values:');
    result2.rows.forEach(row => {
      console.log(`   "${row.enumlabel}"`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnums();