const { Client } = require('pg');

async function checkAllTables() {
  console.log('Checking RABHAN database tables...\n');
  
  const databases = [
    { name: 'rabhan_auth', description: 'Auth Service' },
    { name: 'rabhan_user', description: 'User Service' },
    { name: 'rabhan_document', description: 'Document Service' }
  ];
  
  for (const db of databases) {
    console.log(`=== ${db.description} (${db.name}) ===`);
    
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: db.name,
      user: 'postgres',
      password: '12345'
    });
    
    try {
      await client.connect();
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      
      if (result.rows.length === 0) {
        console.log('❌ No tables found!');
      } else {
        console.log('✅ Tables found:');
        result.rows.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      }
      
      await client.end();
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

checkAllTables();