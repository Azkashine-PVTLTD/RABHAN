// Check what tables actually exist in each database
const { Pool } = require('pg');

async function checkActualTables() {
  console.log('=== ACTUAL DATABASE STRUCTURE ===\n');

  // Auth Database
  const authPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_auth',
    password: '12345',
    port: 5432,
  });

  // User Database  
  const userPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_user',
    password: '12345',
    port: 5432,
  });

  // Document Database
  const docPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_document',
    password: '12345',
    port: 5432,
  });

  try {
    // 1. AUTH DATABASE STRUCTURE
    console.log('🔐 AUTH DATABASE (rabhan_auth)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const authTables = await authPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABLES:');
    for (const table of authTables.rows) {
      console.log(`   ├─ ${table.table_name}`);
      
      // Show record count
      try {
        const count = await authPool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`   │  └─ Records: ${count.rows[0].count}`);
      } catch (e) {
        console.log(`   │  └─ Records: Error counting`);
      }
    }

    // Show sample auth users
    const authUsers = await authPool.query(`
      SELECT id, first_name, last_name, email, national_id, role, user_type 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n👤 RECENT USERS:');
    authUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`      ├─ ID: ${user.id}`);
      console.log(`      ├─ Email: ${user.email}`);
      console.log(`      ├─ National ID: ${user.national_id}`);
      console.log(`      └─ Type: ${user.user_type} (${user.role})`);
    });

    // 2. USER DATABASE STRUCTURE
    console.log('\n\n👤 USER DATABASE (rabhan_user)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const userTables = await userPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABLES:');
    for (const table of userTables.rows) {
      console.log(`   ├─ ${table.table_name}`);
      
      // Show record count
      try {
        const count = await userPool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`   │  └─ Records: ${count.rows[0].count}`);
      } catch (e) {
        console.log(`   │  └─ Records: Error counting`);
      }
    }

    // Show sample user profiles (check the actual table name)
    for (const table of userTables.rows) {
      if (table.table_name.includes('profile') || table.table_name.includes('user')) {
        try {
          const profiles = await userPool.query(`
            SELECT * FROM ${table.table_name} 
            ORDER BY created_at DESC 
            LIMIT 2
          `);
          
          console.log(`\n🏠 SAMPLE DATA FROM ${table.table_name.toUpperCase()}:`);
          profiles.rows.forEach((profile, index) => {
            console.log(`   Profile ${index + 1}:`);
            Object.keys(profile).forEach(key => {
              if (['id', 'auth_user_id', 'region', 'city', 'property_type', 'created_at'].includes(key)) {
                console.log(`      ├─ ${key}: ${profile[key]}`);
              }
            });
          });
        } catch (e) {
          console.log(`   Error reading ${table.table_name}: ${e.message}`);
        }
      }
    }

    // 3. DOCUMENT DATABASE STRUCTURE
    console.log('\n\n📄 DOCUMENT DATABASE (rabhan_document)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const docTables = await docPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABLES:');
    if (docTables.rows.length > 0) {
      for (const table of docTables.rows) {
        console.log(`   ├─ ${table.table_name}`);
        
        try {
          const count = await docPool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
          console.log(`   │  └─ Records: ${count.rows[0].count}`);
        } catch (e) {
          console.log(`   │  └─ Records: Error counting`);
        }
      }
    } else {
      console.log('   No tables found (migrations not run)');
    }

    // 4. VERIFY RELATIONSHIPS
    console.log('\n\n🔗 VERIFY CROSS-DATABASE RELATIONSHIPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find the actual profile table name
    const profileTableName = userTables.rows.find(t => 
      t.table_name.includes('profile') || t.table_name === 'user_profiles'
    )?.table_name;
    
    if (profileTableName) {
      console.log(`✅ Profile table found: ${profileTableName}`);
      
      // Check foreign key relationships
      const relationships = await userPool.query(`
        SELECT ${profileTableName}.auth_user_id, COUNT(*) as profile_count
        FROM ${profileTableName}
        GROUP BY auth_user_id
        ORDER BY profile_count DESC
        LIMIT 5
      `);
      
      console.log('🔗 FOREIGN KEY RELATIONSHIPS:');
      for (const rel of relationships.rows) {
        // Check if this auth_user_id exists in auth database
        const authUser = await authPool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [rel.auth_user_id]
        );
        
        if (authUser.rows.length > 0) {
          const user = authUser.rows[0];
          console.log(`   ✅ ${user.first_name} ${user.last_name} → ${rel.profile_count} profile(s)`);
          console.log(`      └─ Auth ID: ${rel.auth_user_id}`);
        } else {
          console.log(`   ❌ Profile exists but no matching auth user: ${rel.auth_user_id}`);
        }
      }
    } else {
      console.log('❌ No profile table found in user database');
    }

    // 5. SUMMARY
    console.log('\n\n📊 DATABASE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const authUserCount = await authPool.query('SELECT COUNT(*) as count FROM users');
    console.log(`🔐 Auth Users: ${authUserCount.rows[0].count}`);
    console.log(`📋 Auth Tables: ${authTables.rows.length}`);
    console.log(`📋 User Tables: ${userTables.rows.length}`);
    console.log(`📋 Document Tables: ${docTables.rows.length}`);

  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  } finally {
    await authPool.end();
    await userPool.end();
    await docPool.end();
  }
}

checkActualTables();