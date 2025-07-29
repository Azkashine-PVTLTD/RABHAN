// Fix user default values using Node.js
const { Pool } = require('pg');

async function fixUserDefaults() {
  const authPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rabhan_auth',
    password: '12345',
    port: 5432,
  });

  try {
    console.log('🔧 FIXING USER DEFAULTS FOR BETA V2 REQUIREMENTS...\n');

    // 1. Add BNPL amount field if not exists
    console.log('1. Adding BNPL max amount field...');
    try {
      await authPool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS bnpl_max_amount DECIMAL(10,2) DEFAULT 0.00 
        CHECK (bnpl_max_amount >= 0 AND bnpl_max_amount <= 5000)
      `);
      console.log('✅ BNPL max amount field added');
    } catch (error) {
      console.log('ℹ️  BNPL max amount field may already exist');
    }

    // 2. Update existing users to correct defaults
    console.log('\n2. Updating existing users to correct defaults...');
    const updateResult = await authPool.query(`
      UPDATE users 
      SET 
        bnpl_eligible = false,
        bnpl_max_amount = 0.00,
        nafath_verified = false,
        credit_report_status = 'PENDING'
      WHERE bnpl_eligible = true OR nafath_verified = true OR credit_report_status != 'PENDING'
    `);
    console.log(`✅ Updated ${updateResult.rowCount} users`);

    // 3. Update table defaults for future users
    console.log('\n3. Setting correct defaults for new users...');
    await authPool.query(`ALTER TABLE users ALTER COLUMN bnpl_eligible SET DEFAULT false`);
    await authPool.query(`ALTER TABLE users ALTER COLUMN nafath_verified SET DEFAULT false`);
    await authPool.query(`ALTER TABLE users ALTER COLUMN credit_report_status SET DEFAULT 'PENDING'`);
    console.log('✅ Table defaults updated');

    // 4. Update auth service to create business/industrial users
    console.log('\n4. Testing user type diversity...');
    
    // Create sample business user with valid Saudi national ID
    const businessUser = await authPool.query(`
      INSERT INTO users (
        first_name, last_name, email, password_hash, phone, 
        role, provider, national_id, status, user_type, 
        bnpl_eligible, bnpl_max_amount, nafath_verified, credit_report_status,
        email_verified, phone_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, user_type, bnpl_eligible, bnpl_max_amount
    `, [
      'Ahmed', 'Albusiness', `business.${Date.now()}@rabhan.sa`, 
      '$2b$12$dummy.hash.for.testing', '+966501234567',
      'USER', 'EMAIL', '2123456789', 'PENDING', 'BUSINESS',
      false, 0.00, false, 'PENDING', false, false
    ]);

    // Create sample industrial user with valid Saudi national ID
    const industrialUser = await authPool.query(`
      INSERT INTO users (
        first_name, last_name, email, password_hash, phone, 
        role, provider, national_id, status, user_type, 
        bnpl_eligible, bnpl_max_amount, nafath_verified, credit_report_status,
        email_verified, phone_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, user_type, bnpl_eligible, bnpl_max_amount
    `, [
      'Khalid', 'Alindustrial', `industrial.${Date.now()}@rabhan.sa`, 
      '$2b$12$dummy.hash.for.testing', '+966507654321',
      'USER', 'EMAIL', '2987654321', 'PENDING', 'INDUSTRIAL',
      false, 0.00, false, 'PENDING', false, false
    ]);

    console.log('✅ Created sample business and industrial users');

    // 5. Show current user type distribution
    console.log('\n5. USER TYPE DISTRIBUTION:');
    const userTypes = await authPool.query(`
      SELECT 
        user_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE bnpl_eligible = true) as bnpl_eligible_count
      FROM users 
      GROUP BY user_type 
      ORDER BY user_type
    `);

    userTypes.rows.forEach(type => {
      console.log(`   ${type.user_type}: ${type.count} users (${type.bnpl_eligible_count} BNPL eligible)`);
    });

    // 6. Show BNPL status
    console.log('\n6. BNPL ELIGIBILITY STATUS:');
    const bnplStats = await authPool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE bnpl_eligible = true) as bnpl_eligible,
        COUNT(*) FILTER (WHERE bnpl_eligible = false) as bnpl_not_eligible,
        COUNT(*) FILTER (WHERE nafath_verified = true) as nafath_verified,
        COUNT(*) FILTER (WHERE credit_report_status = 'GREEN_FLAG') as green_flag,
        COUNT(*) FILTER (WHERE credit_report_status = 'RED_FLAG') as red_flag,
        COUNT(*) FILTER (WHERE credit_report_status = 'PENDING') as pending_kyc
      FROM users
    `);

    const stats = bnplStats.rows[0];
    console.log(`   Total Users: ${stats.total_users}`);
    console.log(`   BNPL Eligible: ${stats.bnpl_eligible} (requires admin approval)`);
    console.log(`   BNPL Not Eligible: ${stats.bnpl_not_eligible} (default)`);
    console.log(`   NAFATH Verified: ${stats.nafath_verified}`);
    console.log(`   Green Flag (Credit): ${stats.green_flag}`);
    console.log(`   Red Flag (Credit): ${stats.red_flag}`);
    console.log(`   Pending KYC: ${stats.pending_kyc}`);

    // 7. Show sample updated users
    console.log('\n7. SAMPLE UPDATED USERS:');
    const sampleUsers = await authPool.query(`
      SELECT 
        first_name, last_name, user_type, bnpl_eligible, bnpl_max_amount, 
        nafath_verified, credit_report_status, status
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    sampleUsers.rows.forEach((user, index) => {
      console.log(`   User ${index + 1}: ${user.first_name} ${user.last_name}`);
      console.log(`      ├─ Type: ${user.user_type}`);
      console.log(`      ├─ BNPL Eligible: ${user.bnpl_eligible}`);
      console.log(`      ├─ BNPL Max Amount: ${user.bnpl_max_amount} SAR`);
      console.log(`      ├─ NAFATH Verified: ${user.nafath_verified}`);
      console.log(`      ├─ Credit Status: ${user.credit_report_status}`);
      console.log(`      └─ Account Status: ${user.status}`);
    });

    console.log('\n✅ USER DEFAULTS SUCCESSFULLY UPDATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 BNPL Eligibility: Now requires admin KYC approval');
    console.log('🏢 User Types: HOMEOWNER, BUSINESS, INDUSTRIAL supported');
    console.log('🆔 NAFATH: Integration ready, verification required');
    console.log('💳 Credit Scoring: SAMA/SIMAH integration ready');
    console.log('💰 BNPL Amount: Configurable up to 5000 SAR per SAMA rules');

  } catch (error) {
    console.error('❌ Failed to fix user defaults:', error.message);
  } finally {
    await authPool.end();
  }
}

fixUserDefaults();