/**
 * Script to create test contractor account in the database
 * This will create the contractor in the auth service and then create their profile
 */

const bcrypt = require('bcrypt');
const { Client } = require('pg');

// Database configurations
const authDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'rabhan_auth',
  user: 'postgres',
  password: '12345'
};

const contractorDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'rabhan_contractors',
  user: 'postgres',
  password: '12345'
};

// Test contractor data
const testContractor = {
  email: 'contractor@rabhan.sa',
  password: 'Contractor123!',
  first_name: 'Ahmed',
  last_name: 'Al-Contractor',
  phone: '+966501234567',
  role: 'CONTRACTOR',
  status: 'ACTIVE',
  // Business profile data
  business_name: 'Al-Noor Solar Solutions',
  business_name_ar: 'شركة النور للطاقة الشمسية',
  business_type: 'FULL_CONTRACTOR',
  commercial_registration: 'CR1010123456',
  vat_number: '300123456789003',
  website: 'https://alnoor-solar.sa',
  whatsapp: '+966501234567',
  address_line1: 'King Fahd Road, Al Olaya District',
  address_line2: 'Building 123, Floor 3',
  city: 'Riyadh',
  region: 'Riyadh',
  postal_code: '12345',
  latitude: 24.7136,
  longitude: 46.6753,
  established_year: 2018,
  employee_count: 15,
  description: 'Leading solar energy solutions provider in Riyadh',
  description_ar: 'مزود رائد لحلول الطاقة الشمسية في الرياض',
  service_categories: ['RESIDENTIAL_SOLAR', 'COMMERCIAL_SOLAR'],
  service_areas: ['Riyadh', 'Eastern Province', 'Jeddah'],
  years_experience: 6,
  verification_level: 3
};

async function createTestContractor() {
  const authClient = new Client(authDbConfig);
  
  try {
    // Connect to auth database
    await authClient.connect();
    
    console.log('🔑 Creating contractor in auth service...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testContractor.password, 12);
    
    // Create user in auth service with CONTRACTOR role
    const authQuery = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, 
        role, status, email_verified, phone_verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, true, true, NOW(), NOW()
      ) 
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id
    `;
    
    const authResult = await authClient.query(authQuery, [
      testContractor.email,
      hashedPassword,
      testContractor.first_name,
      testContractor.last_name,
      testContractor.phone,
      testContractor.role,
      testContractor.status
    ]);
    
    const userId = authResult.rows[0].id;
    console.log(`✅ Contractor created in auth service with ID: ${userId}`);
    
    console.log('\n🎉 Test contractor account created successfully!');
    console.log('📧 Email:', testContractor.email);
    console.log('🔐 Password:', testContractor.password);
    console.log('👤 Role: CONTRACTOR');
    console.log('🆔 User ID:', userId);
    console.log('\n💡 Use these credentials to log in as a contractor');
    console.log('📝 The contractor profile will be created when they first register through the UI');
    
  } catch (error) {
    console.error('❌ Error creating test contractor:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running and the rabhan_auth database exists');
    }
    
    if (error.code === '42P01') {
      console.log('\n💡 Make sure the users table exists in rabhan_auth database');
      console.log('Run the auth service migrations first');
    }
    
  } finally {
    await authClient.end();
  }
}

// Run the script
if (require.main === module) {
  createTestContractor();
}

module.exports = { createTestContractor };