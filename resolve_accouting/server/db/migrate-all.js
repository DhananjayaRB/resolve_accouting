import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all migration files in order
// Format: { file: 'filename', path: 'relative path from migrations folder or absolute' }
const migrations = [
  { file: '001_create_ledger_table.sql', path: '001_create_ledger_table.sql' },
  { file: '001_create_payroll_mappings.sql', path: '001_create_payroll_mappings.sql' },
  { file: '001_create_tally_push_logs.sql', path: path.resolve(__dirname, '../../src/server/migrations/001_create_tally_push_logs.sql') },
  { file: '002_create_organization_tally_config.sql', path: '002_create_organization_tally_config.sql' },
  { file: '004_add_org_id_to_tables.sql', path: '004_add_org_id_to_tables.sql' }
];

async function runMigrations() {
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

    console.log('Starting migrations...\n');

    for (const migration of migrations) {
      // Resolve the actual path to the migration file
      let actualPath;
      if (path.isAbsolute(migration.path)) {
        actualPath = migration.path;
      } else {
        actualPath = path.resolve(__dirname, 'migrations', migration.path);
      }

      // Check if migration file exists
      if (!fs.existsSync(actualPath)) {
        console.log(`⚠️  Migration file not found: ${actualPath}`);
        console.log(`   Skipping...\n`);
        continue;
      }

      // Check if migration has already been run
      const checkResult = await client.query(
        'SELECT * FROM schema_migrations WHERE migration_name = $1',
        [migration.file]
      );

      if (checkResult.rows.length > 0) {
        console.log(`✓ Migration already executed: ${migration.file}`);
        continue;
      }

      console.log(`Running migration: ${migration.file}...`);
      
      // Read and execute migration
      const migrationSQL = fs.readFileSync(actualPath, 'utf8');
      
      // Execute migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [migration.file]
        );
        await client.query('COMMIT');
        console.log(`✓ Successfully executed: ${migration.file}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

export { runMigrations };

// Run if called directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('migrate-all.js') || 
  process.argv[1].replace(/\\/g, '/').endsWith('migrate-all.js')
);

if (isMainModule) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

