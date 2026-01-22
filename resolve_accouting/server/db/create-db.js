import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connect to default postgres database to create our database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres database
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

export async function createDatabase() {
  try {
    // Check if database exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'resolve_accounting']
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME || 'resolve_accounting'}`);
      console.log(`Database ${process.env.DB_NAME || 'resolve_accounting'} created successfully`);
    } else {
      console.log(`Database ${process.env.DB_NAME || 'resolve_accounting'} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('create-db.js') || 
  process.argv[1].replace(/\\/g, '/').endsWith('create-db.js')
);

if (isMainModule) {
  createDatabase().catch((error) => {
    console.error('Failed to create database:', error);
    process.exit(1);
  });
} 