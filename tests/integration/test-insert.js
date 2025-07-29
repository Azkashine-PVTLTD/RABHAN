#!/usr/bin/env node

const { Client } = require('pg');

async function testInsert() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rabhan_document',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    
    // Test insert with actual values
    const query = `
      INSERT INTO documents (
        auth_user_id, category_id, document_type, original_filename,
        file_size_bytes, mime_type, file_hash, file_extension,
        storage_provider, storage_bucket, storage_path, storage_region,
        encryption_key_id, encryption_algorithm, validation_score, 
        auto_extracted_data, status, sama_audit_log
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING id
    `;
    
    const values = [
      '1f475729-c2e0-4b3d-a678-e4a4ea4d6cc0', // auth_user_id
      '99655c95-616f-4f28-8b4d-84b683b23642', // category_id
      'primary',                                // document_type
      'test.png',                              // original_filename
      12345,                                   // file_size_bytes
      'image/png',                            // mime_type
      'testhashabc123',                       // file_hash
      'png',                                  // file_extension
      'minio',                                // storage_provider
      'rabhan-documents',                     // storage_bucket
      '/test/path',                           // storage_path
      'ksa-central',                          // storage_region
      'default-key',                          // encryption_key_id
      'AES-256-GCM',                         // encryption_algorithm
      85.0,                                   // validation_score
      JSON.stringify({}),                     // auto_extracted_data
      'pending',                              // status
      JSON.stringify([{event: 'test'}])       // sama_audit_log
    ];
    
    const result = await client.query(query, values);
    console.log('✅ Insert successful! ID:', result.rows[0].id);
    
    // Clean up
    await client.query('DELETE FROM documents WHERE id = $1', [result.rows[0].id]);
    console.log('🧹 Test record cleaned up');
    
  } catch (error) {
    console.error('❌ Insert failed:', error.message);
    console.log('Error details:', error);
  } finally {
    await client.end();
  }
}

testInsert();