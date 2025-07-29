// Frontend vs Backend Schema Contrast Analysis
const { Pool } = require('pg');

async function analyzeSchemaContrast() {
  const authPool = new Pool({
    user: 'postgres', host: 'localhost', database: 'rabhan_auth',
    password: '12345', port: 5432
  });

  const userPool = new Pool({
    user: 'postgres', host: 'localhost', database: 'rabhan_user',
    password: '12345', port: 5432
  });

  try {
    console.log('🔍 FRONTEND vs BACKEND SCHEMA CONTRAST ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════');

    // Frontend FormData structure (from analysis)
    const frontendFields = {
      // Basic Identity
      'email': 'string',
      'password': 'string',
      'confirmPassword': 'string',
      'phone': 'string',
      'nationalId': 'string',
      'firstName': 'string',
      'lastName': 'string',
      
      // Address Information
      'region': 'string',
      'city': 'string',
      'district': 'string',
      'streetAddress': 'string',
      'landmark': 'string',
      'postalCode': 'string',
      'additionalAddress': 'string',
      
      // Property & Energy Information
      'propertyType': 'string',
      'propertyOwnership': 'string',
      'roofSize': 'string',
      'gpsLatitude': 'string',
      'gpsLongitude': 'string',
      'electricityConsumption': 'string',
      'electricityMeterNumber': 'string',
      
      // Preferences
      'preferredLanguage': 'string',
      'emailNotifications': 'string',
      'smsNotifications': 'string',
      'marketingConsent': 'string'
    };

    // Check auth service schema
    console.log('🔐 AUTH SERVICE SCHEMA (rabhan_auth.users):');
    const authSchema = await authPool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    authSchema.rows.forEach(col => {
      const hasDefault = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`   ├─ ${col.column_name}: ${col.data_type}${hasDefault}`);
    });

    // Check user service schema
    console.log('\n👤 USER SERVICE SCHEMA (rabhan_user.user_profiles):');
    const userSchema = await userPool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

    if (userSchema.rows.length > 0) {
      userSchema.rows.forEach(col => {
        const hasDefault = col.column_default ? ` (default: ${col.column_default})` : '';
        console.log(`   ├─ ${col.column_name}: ${col.data_type}${hasDefault}`);
      });
    } else {
      console.log('   ❌ No user_profiles table found');
    }

    // Analyze field mapping
    console.log('\n📋 FRONTEND TO BACKEND FIELD MAPPING:');
    console.log('═══════════════════════════════════════════════════════════════');

    const authFieldMap = {};
    authSchema.rows.forEach(col => {
      authFieldMap[col.column_name] = col.data_type;
    });

    const userFieldMap = {};
    userSchema.rows.forEach(col => {
      userFieldMap[col.column_name] = col.data_type;
    });

    console.log('✅ MATCHING FIELDS:');
    const mappedFields = [];
    
    // Auth service mappings
    const authMappings = {
      'email': 'email',
      'phone': 'phone', 
      'nationalId': 'national_id',
      'firstName': 'first_name',
      'lastName': 'last_name'
    };

    Object.entries(authMappings).forEach(([frontend, backend]) => {
      if (authFieldMap[backend]) {
        console.log(`   ├─ ${frontend} → auth.${backend} (${authFieldMap[backend]})`);
        mappedFields.push(frontend);
      }
    });

    // User service mappings
    const userMappings = {
      'region': 'region',
      'city': 'city',
      'district': 'district',
      'streetAddress': 'street_address',
      'landmark': 'landmark',
      'postalCode': 'postal_code',
      'propertyType': 'property_type',
      'propertyOwnership': 'property_ownership',
      'roofSize': 'roof_size',
      'gpsLatitude': 'gps_latitude',
      'gpsLongitude': 'gps_longitude',
      'electricityConsumption': 'electricity_consumption',
      'electricityMeterNumber': 'electricity_meter_number',
      'preferredLanguage': 'preferred_language',
      'emailNotifications': 'email_notifications',
      'smsNotifications': 'sms_notifications',
      'marketingConsent': 'marketing_consent'
    };

    Object.entries(userMappings).forEach(([frontend, backend]) => {
      if (userFieldMap[backend]) {
        console.log(`   ├─ ${frontend} → user.${backend} (${userFieldMap[backend]})`);
        mappedFields.push(frontend);
      }
    });

    // Missing fields analysis
    console.log('\n❌ MISSING BACKEND FIELDS:');
    const missingFields = Object.keys(frontendFields).filter(field => !mappedFields.includes(field));
    missingFields.forEach(field => {
      console.log(`   ├─ ${field} (${frontendFields[field]}) - NO BACKEND MAPPING`);
    });

    // Extra backend fields
    console.log('\n📊 EXTRA BACKEND FIELDS (not in frontend):');
    const allBackendFields = [...Object.keys(authFieldMap), ...Object.keys(userFieldMap)];
    const frontendMapped = Object.values(authMappings).concat(Object.values(userMappings));
    const extraFields = allBackendFields.filter(field => !frontendMapped.includes(field));
    
    extraFields.forEach(field => {
      const service = authFieldMap[field] ? 'auth' : 'user';
      const type = authFieldMap[field] || userFieldMap[field];
      console.log(`   ├─ ${service}.${field} (${type}) - NOT IN FRONTEND`);
    });

    // BNPL Analysis
    console.log('\n💳 BNPL ELIGIBILITY ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const bnplStats = await authPool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE bnpl_eligible = true) as bnpl_eligible,
        COUNT(*) FILTER (WHERE user_type = 'HOMEOWNER') as homeowners,
        COUNT(*) FILTER (WHERE user_type = 'BUSINESS') as business_users,
        COUNT(*) FILTER (WHERE user_type = 'INDUSTRIAL') as industrial_users
      FROM users
    `);

    const stats = bnplStats.rows[0];
    console.log(`📊 Database Status:`);
    console.log(`   ├─ Total Users: ${stats.total_users}`);
    console.log(`   ├─ BNPL Eligible: ${stats.bnpl_eligible} (${((stats.bnpl_eligible/stats.total_users)*100).toFixed(1)}%)`);
    console.log(`   ├─ Homeowners: ${stats.homeowners}`);
    console.log(`   ├─ Business: ${stats.business_users}`);
    console.log(`   └─ Industrial: ${stats.industrial_users}`);

    console.log(`\n🎯 Frontend Expectation vs Reality:`);
    console.log(`   ├─ Frontend shows BNPL as key benefit`);
    console.log(`   ├─ Users expect BNPL eligibility after registration`); 
    console.log(`   ├─ Backend: bnpl_eligible = false by default (Beta V2)`);
    console.log(`   ├─ Reality: Admin approval required for BNPL`);
    console.log(`   └─ Gap: Frontend promises vs Backend implementation`);

    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. ✅ Add missing fields to backend schema:');
    console.log('   ├─ additionalAddress → user_profiles.additional_address');
    console.log('   └─ confirmPassword → validation only (don\'t store)');
    
    console.log('\n2. 🔄 Update frontend to match backend reality:');
    console.log('   ├─ Set BNPL expectation as "subject to approval"');
    console.log('   ├─ Add user type selection during registration');
    console.log('   └─ Show BNPL status in user dashboard');
    
    console.log('\n3. 📋 Complete registration flow mapping:');
    console.log('   ├─ Step 1-2: Auth service (basic + verification)');
    console.log('   ├─ Step 3-4: User service (profile + preferences)');  
    console.log('   └─ Step 5: Document service (KYC uploads)');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await authPool.end();
    await userPool.end();
  }
}

analyzeSchemaContrast();