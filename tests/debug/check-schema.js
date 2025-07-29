const { Client } = require('pg');

async function checkUsersTable() {
  console.log('Checking Auth Service Users Table Schema...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_auth',
    user: 'postgres',
    password: '12345'
  });
  
  try {
    await client.connect();
    
    // Get the exact schema of users table
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table schema:');
    console.log('=====================');
    schemaResult.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(20)} | ${row.data_type.padEnd(15)} | ${row.is_nullable.padEnd(10)} | ${row.column_default || 'NULL'}`);
    });
    
    // Also check existing users
    console.log('\nExisting users:');
    console.log('===============');
    const usersResult = await client.query('SELECT id, email, role, created_at FROM users LIMIT 5');
    usersResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable();