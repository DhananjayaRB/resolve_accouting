import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Helper function to parse SSL mode from connection string
function getSSLConfig(connectionString) {
  if (!connectionString) return false;
  
  // Parse query parameters from connection string
  const queryString = connectionString.split('?')[1];
  if (queryString) {
    const params = new URLSearchParams(queryString);
    const sslMode = params.get('sslmode');
    
    // If sslmode=disable, don't use SSL
    if (sslMode === 'disable') {
      return false;
    }
    
    // If sslmode=require, use SSL
    if (sslMode === 'require') {
      return { rejectUnauthorized: false };
    }
  }
  
  // Default: use SSL in production, no SSL in development
  return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

// Support both connection string (for Vercel Postgres) and individual config
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const poolConfig = connectionString
  ? {
      connectionString: connectionString,
      ssl: getSSLConfig(connectionString),
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'resolve_accounting',
      password: process.env.DB_PASSWORD || 'Resolve@321',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool; 