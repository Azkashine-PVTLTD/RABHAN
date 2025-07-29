const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rabhan_auth',
  user: 'postgres',
  password: '12345'
});

async function checkUser() {
  try {
    const email = 'jpnan.38@gmail.com';
    const result = await pool.query('SELECT email, phone, phone_verified FROM users WHERE email = $1', [email]);
    
    console.log('User found:', result.rows.length > 0);
    if (result.rows.length > 0) {
      console.log('Email:', result.rows[0].email);
      console.log('Phone:', result.rows[0].phone);
      console.log('Phone verified:', result.rows[0].phone_verified);
    } else {
      console.log('No user found with email:', email);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Database error:', error.message);
    await pool.end();
  }
}

checkUser();