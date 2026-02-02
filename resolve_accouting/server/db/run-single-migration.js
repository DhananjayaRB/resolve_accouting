import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSingleMigration(migrationFile) {
  const client = await pool.connect();
  
  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationPath = path.resolve(__dirname, 'migrations', migrationFile);
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    // Check if migration has already been run
    const checkResult = await client.query(
      'SELECT * FROM schema_migrations WHERE migration_name = $1',
      [migrationFile]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✓ Migration already executed: ${migrationFile}`);
      return;
    }

    console.log(`Running migration: ${migrationFile}...`);
    
    // Read and execute migration
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration in a transaction
    await client.query('BEGIN');
    try {
      await client.query(migrationSQL);
      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [migrationFile]
      );
      await client.query('COMMIT');
      console.log(`✓ Successfully executed: ${migrationFile}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-single-migration.js <migration-file>');
  console.error('Example: node run-single-migration.js 005_create_tally_groups_table.sql');
  process.exit(1);
}

runSingleMigration(migrationFile).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

