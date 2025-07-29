const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_user',
    password: '12345',
    port: 5432,
  });

  try {
    // Check if user_profiles table exists
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ user_profiles table exists with columns:');
      result.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ user_profiles table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();