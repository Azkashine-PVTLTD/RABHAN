#!/usr/bin/env node

const { Client } = require('pg');

async function fixDocumentsTable() {
  console.log('🔧 Fixing documents table schema...');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_document',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user_id column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'user_id'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('❌ user_id column missing. Adding it...');
      
      // Add user_id column
      await client.query(`
        ALTER TABLE documents 
        ADD COLUMN user_id UUID NOT NULL DEFAULT uuid_generate_v4()
      `);
      
      console.log('✅ user_id column added');
    } else {
      console.log('✅ user_id column exists');
    }

    // Check current columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Current documents table columns:');
    columns.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n🎉 Documents table schema fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDocumentsTable();