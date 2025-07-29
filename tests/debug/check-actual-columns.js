#!/usr/bin/env node

const { Client } = require('pg');

async function checkActualColumns() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_document',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    
    // Get all columns for documents table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Current documents table columns:');
    console.log('=====================================');
    columns.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test a simple insert to see what works
    console.log('\n🧪 Testing minimal insert...');
    
    const testQuery = `
      INSERT INTO documents (
        auth_user_id, category_id, original_filename,
        file_size_bytes, mime_type, file_extension,
        storage_path, file_hash
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id
    `;
    
    try {
      const result = await client.query(testQuery, [
        '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0',
        '99655c95-616f-4f28-8b4d-84b683b23642',
        'test.png',
        12345,
        'image/png',
        'png',
        '/test/path',
        'testhashabc123'
      ]);
      
      console.log('✅ Minimal insert successful! ID:', result.rows[0].id);
      
      // Clean up test record
      await client.query('DELETE FROM documents WHERE id = $1', [result.rows[0].id]);
      console.log('🧹 Test record cleaned up');
      
    } catch (error) {
      console.log('❌ Minimal insert failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkActualColumns();