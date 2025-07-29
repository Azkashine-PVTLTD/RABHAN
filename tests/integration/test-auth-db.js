const { Client } = require('pg');

async function testAuthDatabase() {
  console.log('Testing Auth Service Database Connection...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_auth',
    user: 'postgres',
    password: '12345'
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to auth database');
    
    // Check if users table exists and is accessible
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if we can insert a test user (then delete it)
    console.log('\nTesting user insertion...');
    
    // First, check current users
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Current users count: ${existingUsers.rows[0].count}`);
    
    // Try to insert a test user
    const testUser = {
      email: 'dbtest@example.com',
      password_hash: '$2b$12$dummy.hash.for.testing',
      role: 'USER',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    try {
      const insertResult = await client.query(
        'INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [testUser.email, testUser.password_hash, testUser.role, testUser.is_active, testUser.created_at, testUser.updated_at]
      );
      
      const userId = insertResult.rows[0].id;
      console.log(`✅ Test user inserted with ID: ${userId}`);
      
      // Clean up - delete the test user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      console.log('✅ Test user cleaned up');
      
    } catch (insertError) {
      console.log('❌ Failed to insert test user:', insertError.message);
      console.log('Error details:', insertError);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await client.end();
  }
}

testAuthDatabase();