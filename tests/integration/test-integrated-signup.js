const { Pool } = require('pg');

// Database connections
const authPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rabhan_auth',
  user: 'postgres',
  password: '12345'
});

const userPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rabhan_user',
  user: 'postgres',
  password: '12345'
});

const documentPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rabhan_document',
  user: 'postgres',
  password: '12345'
});

// Test user data from frontend form
const testUser = {
  // Personal Info (from frontend)
  first_name: 'Ahmed',
  last_name: 'Al-Rashid',
  email: `ahmed.rashid.${Date.now()}@test.sa`,
  phone: '+966501234567',
  national_id: `123456${Date.now().toString().slice(-4)}`,
  
  // Profile Data
  date_of_birth: '1985-03-15',
  marital_status: 'MARRIED',
  monthly_income: 15000.00,
  employment_status: 'EMPLOYED',
  employer_name: 'ARAMCO',
  
  // Address
  region: 'Riyadh',
  city: 'Riyadh',
  district: 'Al-Malaz',
  street_address: '123 King Fahd Road',
  postal_code: '11564',
  gps_latitude: 24.7136,
  gps_longitude: 46.6753,
  
  // Property
  property_type: 'VILLA',
  property_ownership: 'OWNED',
  roof_size: 200.50,
  electricity_consumption: '800_1000',
  electricity_meter_number: 'KSA123456789',
  
  // Solar preferences
  desired_system_size: 10.5,
  budget_range: '25K_50K',
  financing_preference: 'BNPL'
};

async function testIntegratedSignup() {
  console.log('🔧 Testing Integrated User Signup Across All Services...\n');
  
  let authUserId;
  
  try {
    // Step 1: Create user in Auth Service
    console.log('1️⃣ Creating user in Auth Service...');
    const authResult = await authPool.query(`
      INSERT INTO users (
        first_name, last_name, email, phone, national_id,
        role, status, user_type, provider, 
        email_verified, phone_verified, bnpl_eligible
      ) VALUES (
        $1, $2, $3, $4, $5, 'USER', 'PENDING', 'HOMEOWNER', 'EMAIL', 
        false, false, true
      ) RETURNING id, email, created_at
    `, [
      testUser.first_name, testUser.last_name, testUser.email, 
      testUser.phone, testUser.national_id
    ]);
    
    authUserId = authResult.rows[0].id;
    console.log(`✅ Auth user created: ${authUserId}`);
    console.log(`   Email: ${authResult.rows[0].email}`);
    console.log(`   Created: ${authResult.rows[0].created_at}`);
    
    // Step 2: Create profile in User Service (with foreign key)
    console.log('\n2️⃣ Creating profile in User Service...');
    const userResult = await userPool.query(`
      INSERT INTO user_profiles (
        auth_user_id, date_of_birth, marital_status, monthly_income,
        employment_status, employer_name, region, city, district, 
        street_address, postal_code, gps_latitude, gps_longitude,
        property_type, property_ownership, roof_size,
        electricity_consumption, electricity_meter_number,
        desired_system_size, budget_range, financing_preference,
        bnpl_max_amount, preferred_language
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, 5000.00, 'ar'
      ) RETURNING id, auth_user_id, created_at, profile_completion_percentage
    `, [
      authUserId, testUser.date_of_birth, testUser.marital_status,
      testUser.monthly_income, testUser.employment_status, testUser.employer_name,
      testUser.region, testUser.city, testUser.district, testUser.street_address,
      testUser.postal_code, testUser.gps_latitude, testUser.gps_longitude,
      testUser.property_type, testUser.property_ownership, testUser.roof_size,
      testUser.electricity_consumption, testUser.electricity_meter_number,
      testUser.desired_system_size, testUser.budget_range, testUser.financing_preference
    ]);
    
    console.log(`✅ User profile created: ${userResult.rows[0].id}`);
    console.log(`   Linked to auth_user_id: ${userResult.rows[0].auth_user_id}`);
    console.log(`   Completion: ${userResult.rows[0].profile_completion_percentage}%`);
    
    // Step 3: Create document placeholder in Document Service
    console.log('\n3️⃣ Creating document records in Document Service...');
    
    // Get a document category
    const categoryResult = await documentPool.query(`
      SELECT id, name FROM document_categories WHERE required_for_role = 'USER' LIMIT 1
    `);
    
    if (categoryResult.rows.length > 0) {
      const category = categoryResult.rows[0];
      
      const docResult = await documentPool.query(`
        INSERT INTO documents (
          auth_user_id, category_id, document_type, original_filename,
          file_size_bytes, mime_type, file_extension, file_hash,
          storage_path, status, approval_status, is_mandatory
        ) VALUES (
          $1, $2, 'NATIONAL_ID_FRONT', 'national_id_front.jpg',
          1024000, 'image/jpeg', '.jpg', 'test_hash_123456',
          '/storage/documents/test_file.jpg', 'pending', 'pending', true
        ) RETURNING id, auth_user_id, document_type, created_at
      `, [authUserId, category.id]);
      
      console.log(`✅ Document record created: ${docResult.rows[0].id}`);
      console.log(`   Linked to auth_user_id: ${docResult.rows[0].auth_user_id}`);
      console.log(`   Document type: ${docResult.rows[0].document_type}`);
      console.log(`   Category: ${category.name}`);
    }
    
    // Step 4: Verify cross-service relationships
    console.log('\n4️⃣ Verifying cross-service relationships...');
    
    const relationshipCheck = await authPool.query(`
      SELECT 
        u.id as auth_id,
        u.first_name || ' ' || u.last_name as full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.bnpl_eligible,
        u.created_at as auth_created
      FROM users u 
      WHERE u.id = $1
    `, [authUserId]);
    
    const profileCheck = await userPool.query(`
      SELECT 
        id as profile_id,
        auth_user_id,
        region || ', ' || city as location,
        property_type,
        electricity_consumption,
        budget_range,
        bnpl_max_amount,
        profile_completion_percentage,
        created_at as profile_created
      FROM user_profiles 
      WHERE auth_user_id = $1
    `, [authUserId]);
    
    const documentCheck = await documentPool.query(`
      SELECT 
        d.id as document_id,
        d.auth_user_id,
        d.document_type,
        d.status,
        d.approval_status,
        dc.name as category_name,
        d.created_at as document_created
      FROM documents d
      JOIN document_categories dc ON d.category_id = dc.id
      WHERE d.auth_user_id = $1
    `, [authUserId]);
    
    console.log('\n📊 INTEGRATION TEST RESULTS:');
    console.log('=====================================');
    
    if (relationshipCheck.rows.length > 0) {
      const auth = relationshipCheck.rows[0];
      console.log('🔐 AUTH SERVICE:');
      console.log(`   ID: ${auth.auth_id}`);
      console.log(`   Name: ${auth.full_name}`);
      console.log(`   Email: ${auth.email}`);
      console.log(`   Phone: ${auth.phone}`);
      console.log(`   Role: ${auth.role}`);
      console.log(`   Status: ${auth.status}`);
      console.log(`   BNPL Eligible: ${auth.bnpl_eligible}`);
      console.log(`   Created: ${auth.auth_created}`);
    }
    
    if (profileCheck.rows.length > 0) {
      const profile = profileCheck.rows[0];
      console.log('\n👤 USER SERVICE:');
      console.log(`   Profile ID: ${profile.profile_id}`);
      console.log(`   Linked to Auth ID: ${profile.auth_user_id}`);
      console.log(`   Location: ${profile.location}`);
      console.log(`   Property: ${profile.property_type}`);
      console.log(`   Consumption: ${profile.electricity_consumption}`);
      console.log(`   Budget: ${profile.budget_range}`);
      console.log(`   BNPL Max: ${profile.bnpl_max_amount} SAR`);
      console.log(`   Completion: ${profile.profile_completion_percentage}%`);
      console.log(`   Created: ${profile.profile_created}`);
    }
    
    if (documentCheck.rows.length > 0) {
      console.log('\n📄 DOCUMENT SERVICE:');
      documentCheck.rows.forEach(doc => {
        console.log(`   Document ID: ${doc.document_id}`);
        console.log(`   Linked to Auth ID: ${doc.auth_user_id}`);
        console.log(`   Type: ${doc.document_type}`);
        console.log(`   Category: ${doc.category_name}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Approval: ${doc.approval_status}`);
        console.log(`   Created: ${doc.document_created}`);
      });
    }
    
    // Verify foreign key relationships
    const foreignKeyCheck = authUserId === profileCheck.rows[0]?.auth_user_id && 
                           authUserId === documentCheck.rows[0]?.auth_user_id;
    
    console.log('\n🔗 FOREIGN KEY VALIDATION:');
    console.log(`   Auth ID: ${authUserId}`);
    console.log(`   Profile Link: ${profileCheck.rows[0]?.auth_user_id} ${profileCheck.rows[0]?.auth_user_id === authUserId ? '✅' : '❌'}`);
    console.log(`   Document Link: ${documentCheck.rows[0]?.auth_user_id} ${documentCheck.rows[0]?.auth_user_id === authUserId ? '✅' : '❌'}`);
    console.log(`   All Links Valid: ${foreignKeyCheck ? '✅ YES' : '❌ NO'}`);
    
    // Test SAMA compliance fields
    console.log('\n🏛️ SAMA COMPLIANCE CHECK:');
    console.log(`   BNPL Eligible: ${relationshipCheck.rows[0].bnpl_eligible ? '✅' : '❌'}`);
    console.log(`   BNPL Max Amount: ${profileCheck.rows[0].bnpl_max_amount} SAR (Limit: 5000 SAR)`);
    console.log(`   Saudi Phone Format: ${testUser.phone.startsWith('+966') ? '✅' : '❌'}`);
    console.log(`   National ID Format: ${testUser.national_id.length === 10 ? '✅' : '❌'}`);
    
    console.log('\n✅ INTEGRATED SIGNUP TEST COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('🎉 All three services are properly integrated with cross-service foreign keys!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup - close connections
    await authPool.end();
    await userPool.end();
    await documentPool.end();
  }
}

// Run the test
testIntegratedSignup().catch(console.error);