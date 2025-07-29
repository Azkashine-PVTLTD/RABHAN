const { Pool } = require('pg');

async function checkUsersSchema() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:12345@localhost:5432/rabhan_auth'
  });

  try {
    console.log('📋 Checking users table schema...');
    
    // Get table columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if user_type column exists
    const userTypeColumn = columnsResult.rows.find(col => col.column_name === 'user_type');
    if (userTypeColumn) {
      console.log('\n✅ user_type column exists');
    } else {
      console.log('\n❌ user_type column is missing!');
    }
    
    // Check enums
    console.log('\n🔍 Checking enum types...');
    const enumsResult = await pool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      ORDER BY t.typname, e.enumsortorder
    `);
    
    const enumTypes = {};
    enumsResult.rows.forEach(row => {
      if (!enumTypes[row.typname]) {
        enumTypes[row.typname] = [];
      }
      enumTypes[row.typname].push(row.enumlabel);
    });
    
    Object.entries(enumTypes).forEach(([typeName, values]) => {
      console.log(`- ${typeName}: [${values.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersSchema();