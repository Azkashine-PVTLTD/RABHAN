const { Client } = require('pg');

async function analyzeAllSchemas() {
  console.log('🔍 ANALYZING RABHAN MICROSERVICES SCHEMAS\n');
  
  const databases = [
    { name: 'rabhan_auth', service: 'Auth Service' },
    { name: 'rabhan_user', service: 'User Service' },
    { name: 'rabhan_document', service: 'Document Service' }
  ];
  
  for (const db of databases) {
    console.log(`========================================`);
    console.log(`📊 ${db.service.toUpperCase()} (${db.name})`);
    console.log(`========================================`);
    
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: db.name,
      user: 'postgres',
      password: '12345'
    });
    
    try {
      await client.connect();
      
      // Get all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'pgmigrations'
        ORDER BY table_name
      `);
      
      console.log(`Tables: ${tablesResult.rows.map(r => r.table_name).join(', ')}\n`);
      
      // For each table, get detailed schema
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        
        console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
        console.log(`${'='.repeat(50)}`);
        
        const schemaResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);
        
        // Format the output nicely
        console.log('FIELD NAME               | TYPE            | NULL | DEFAULT');
        console.log('-'.repeat(70));
        
        schemaResult.rows.forEach(row => {
          const name = row.column_name.padEnd(24);
          const type = row.data_type.padEnd(15);
          const nullable = row.is_nullable.padEnd(4);
          const defaultVal = row.column_default ? row.column_default.substring(0, 20) : 'NULL';
          
          console.log(`${name} | ${type} | ${nullable} | ${defaultVal}`);
        });
        
        // Check for foreign key relationships
        const fkResult = await client.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = $1
        `, [tableName]);
        
        if (fkResult.rows.length > 0) {
          console.log('\n🔗 FOREIGN KEYS:');
          fkResult.rows.forEach(fk => {
            console.log(`   ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }
        
        // Sample data count
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`\n📊 Records: ${countResult.rows[0].count}`);
        
        console.log('\n');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    } finally {
      await client.end();
    }
    
    console.log('\n');
  }
  
  console.log('🔍 ANALYSIS: CHECKING MICROSERVICES INTEGRATION\n');
  console.log('Expected Integration Pattern:');
  console.log('auth.users.id (UUID) → user_profiles.auth_user_id → documents.auth_user_id');
  console.log('\nLet me check if this pattern exists...\n');
}

analyzeAllSchemas();