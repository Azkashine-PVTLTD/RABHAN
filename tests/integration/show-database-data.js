// Show all data created in the three databases
const { Pool } = require('pg');

async function showDatabaseData() {
  console.log('=== DATABASE DATA INSPECTION ===\n');

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
    // 1. AUTH DATABASE - Show users table
    console.log('🔐 AUTH DATABASE (rabhan_auth)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const authUsers = await authPool.query(`
      SELECT 
        id, first_name, last_name, email, phone, national_id, 
        role, status, user_type, bnpl_eligible, email_verified,
        phone_verified, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📋 USERS TABLE:');
    if (authUsers.rows.length > 0) {
      authUsers.rows.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   ├─ ID: ${user.id}`);
        console.log(`   ├─ Name: ${user.first_name} ${user.last_name}`);
        console.log(`   ├─ Email: ${user.email}`);
        console.log(`   ├─ Phone: ${user.phone}`);
        console.log(`   ├─ National ID: ${user.national_id}`);
        console.log(`   ├─ Role: ${user.role}`);
        console.log(`   ├─ Status: ${user.status}`);
        console.log(`   ├─ User Type: ${user.user_type}`);
        console.log(`   ├─ BNPL Eligible: ${user.bnpl_eligible}`);
        console.log(`   ├─ Email Verified: ${user.email_verified}`);
        console.log(`   └─ Created: ${user.created_at}`);
      });
    } else {
      console.log('   No users found');
    }

    // Show user sessions
    const sessions = await authPool.query(`
      SELECT user_id, device_id, ip_address, created_at, expires_at
      FROM user_sessions 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log(`\n📱 USER SESSIONS: ${sessions.rows.length} active sessions`);
    sessions.rows.forEach((session, index) => {
      console.log(`   Session ${index + 1}: User ${session.user_id} from ${session.ip_address}`);
    });

    // 2. USER DATABASE - Show profiles table
    console.log('\n\n👤 USER DATABASE (rabhan_user)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const userProfiles = await userPool.query(`
      SELECT 
        id, auth_user_id, region, city, district, street_address,
        property_type, property_ownership, roof_size, electricity_consumption,
        electricity_meter_number, preferred_language, created_at
      FROM user_profiles 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('🏠 USER PROFILES TABLE:');
    if (userProfiles.rows.length > 0) {
      userProfiles.rows.forEach((profile, index) => {
        console.log(`\n   Profile ${index + 1}:`);
        console.log(`   ├─ Profile ID: ${profile.id}`);
        console.log(`   ├─ Auth User ID: ${profile.auth_user_id}`);
        console.log(`   ├─ Location: ${profile.city}, ${profile.region}`);
        console.log(`   ├─ Address: ${profile.street_address}, ${profile.district}`);
        console.log(`   ├─ Property: ${profile.property_type} (${profile.property_ownership})`);
        console.log(`   ├─ Roof Size: ${profile.roof_size}m²`);
        console.log(`   ├─ Electricity: ${profile.electricity_consumption}`);
        console.log(`   ├─ Meter: ${profile.electricity_meter_number}`);
        console.log(`   ├─ Language: ${profile.preferred_language}`);
        console.log(`   └─ Created: ${profile.created_at}`);
      });
    } else {
      console.log('   No profiles found');
    }

    // Show linked data
    console.log('\n🔗 CROSS-DATABASE RELATIONSHIPS:');
    const linkedData = await authPool.query(`
      SELECT u.id as auth_id, u.first_name, u.last_name, u.email 
      FROM users u 
      WHERE u.id IN (
        SELECT DISTINCT auth_user_id FROM user_profiles LIMIT 5
      )
      ORDER BY u.created_at DESC
    `);
    
    if (linkedData.rows.length > 0) {
      console.log('   ✅ Foreign Key Links Found:');
      for (const user of linkedData.rows) {
        const profileCount = await userPool.query(
          'SELECT COUNT(*) as count FROM user_profiles WHERE auth_user_id = $1',
          [user.auth_id]
        );
        console.log(`   └─ User "${user.first_name} ${user.last_name}" → ${profileCount.rows[0].count} profile(s)`);
      }
    } else {
      console.log('   ❌ No linked data found');
    }

    // 3. DOCUMENT DATABASE - Show tables
    console.log('\n\n📄 DOCUMENT DATABASE (rabhan_document)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check if document tables exist
    const docTables = await docPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 DOCUMENT TABLES:');
    if (docTables.rows.length > 0) {
      docTables.rows.forEach(table => {
        console.log(`   ├─ ${table.table_name}`);
      });
    } else {
      console.log('   No tables found (migrations not run)');
    }

    // Try to show any document data
    try {
      const documents = await docPool.query(`
        SELECT COUNT(*) as count FROM documents
      `);
      console.log(`\n📄 DOCUMENTS: ${documents.rows[0].count} files stored`);
    } catch (error) {
      console.log('\n📄 DOCUMENTS: Table not yet created (migrations needed)');
    }

    // 4. SUMMARY STATISTICS
    console.log('\n\n📊 DATABASE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const authCount = await authPool.query('SELECT COUNT(*) as count FROM users');
    const profileCount = await userPool.query('SELECT COUNT(*) as count FROM user_profiles');
    const sessionCount = await authPool.query('SELECT COUNT(*) as count FROM user_sessions');
    
    console.log(`🔐 Auth Users: ${authCount.rows[0].count}`);
    console.log(`👤 User Profiles: ${profileCount.rows[0].count}`);
    console.log(`📱 Active Sessions: ${sessionCount.rows[0].count}`);
    console.log(`📄 Document Tables: ${docTables.rows.length}`);
    
    // Show integration status
    console.log('\n🔗 INTEGRATION STATUS:');
    if (parseInt(authCount.rows[0].count) > 0 && parseInt(profileCount.rows[0].count) > 0) {
      console.log('✅ Auth ↔ User: Successfully linked via foreign keys');
    } else {
      console.log('❌ Auth ↔ User: No linked data');
    }
    
    if (docTables.rows.length > 0) {
      console.log('✅ Document Service: Database schema ready');
    } else {
      console.log('⚠️  Document Service: Needs migration setup');
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  } finally {
    await authPool.end();
    await userPool.end();
    await docPool.end();
  }
}

showDatabaseData();