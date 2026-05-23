const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS firms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      whatsapp TEXT,
      unique_token UUID NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cheques (
      id SERIAL PRIMARY KEY,
      firm_id INTEGER REFERENCES firms(id),
      firm_name TEXT NOT NULL,
      cheque_number TEXT NOT NULL,
      amount_figures TEXT NOT NULL,
      cheque_date TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      branch TEXT,
      image_path TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- AI verification results
      verification_status TEXT DEFAULT 'pending',
      verification_overall TEXT,
      verification_reason TEXT,
      verification_data JSONB,
      verified_at TIMESTAMPTZ,

      -- Acknowledgment
      acknowledged BOOLEAN DEFAULT FALSE,
      acknowledged_at TIMESTAMPTZ,
      acknowledged_by TEXT,

      -- Status tracking
      status TEXT DEFAULT 'held'
    );
  `);
  console.log('Database initialised');
}

module.exports = { pool, initDB };
