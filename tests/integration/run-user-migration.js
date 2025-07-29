const { Pool } = require('pg');
const fs = require('fs');

async function runMigration() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_user',
    password: '12345',
    port: 5432,
  });

  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('E:/RABHAN/backend/services/user-service/migrations/001_create_user_profiles_table.sql', 'utf8');
    
    console.log('Running migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles', 'user_documents', 'user_activities', 'user_audit_logs')
      ORDER BY table_name
    `);
    
    console.log('✅ Created tables:', result.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();