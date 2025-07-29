#!/usr/bin/env node

const { Client } = require('pg');

async function checkEnumValues() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_document',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    
    // Check enum values for document_type
    const enumQuery = `
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname LIKE '%document%' OR t.typname LIKE '%type%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    const result = await client.query(enumQuery);
    
    console.log('📋 Available enum values:');
    console.log('========================');
    
    const enums = {};
    result.rows.forEach(row => {
      if (!enums[row.typname]) {
        enums[row.typname] = [];
      }
      enums[row.typname].push(row.enumlabel);
    });
    
    Object.keys(enums).forEach(enumName => {
      console.log(`${enumName}:`);
      enums[enumName].forEach(value => {
        console.log(`  - ${value}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEnumValues();