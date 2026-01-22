import pool from './config.js';

/**
 * Truncate all data tables to start fresh
 * This will delete all data but keep the table structure
 */
async function truncateAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting data truncation...\n');
    
    // List of tables to truncate (in order to handle foreign key constraints)
    const tables = [
      'payrun_ledger_mappings',  // Mappings table first (may have dependencies)
      'ledger',                   // Ledger table
      'organization_tally_config', // Tally config
      'tally_push_logs'           // Push logs (if exists)
    ];

    // Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll handle it)
    await client.query('BEGIN');

    for (const table of tables) {
      try {
        // Check if table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (tableExists.rows[0].exists) {
          // Truncate table and reset sequences
          await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
          console.log(`✓ Truncated: ${table}`);
        } else {
          console.log(`⚠️  Table does not exist: ${table} (skipping)`);
        }
      } catch (error) {
        console.error(`❌ Error truncating ${table}:`, error.message);
        // Continue with other tables
      }
    }

    await client.query('COMMIT');
    
    console.log('\n✅ All data tables truncated successfully!');
    console.log('📝 Note: Table structures are preserved. You can now start fresh.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during truncation:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Truncate all data including migration history
 * Use this if you want to completely reset and re-run migrations
 */
async function truncateAllIncludingMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting complete data truncation (including migrations)...\n');
    
    // List of tables to truncate (in order to handle foreign key constraints)
    const tables = [
      'payrun_ledger_mappings',  // Mappings table first (may have dependencies)
      'ledger',                   // Ledger table
      'organization_tally_config', // Tally config
      'tally_push_logs',          // Push logs (if exists)
      'schema_migrations'         // Migration history
    ];

    await client.query('BEGIN');

    for (const table of tables) {
      try {
        // Check if table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (tableExists.rows[0].exists) {
          // Truncate table and reset sequences
          await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
          console.log(`✓ Truncated: ${table}`);
        } else {
          console.log(`⚠️  Table does not exist: ${table} (skipping)`);
        }
      } catch (error) {
        console.error(`❌ Error truncating ${table}:`, error.message);
        // Continue with other tables
      }
    }

    await client.query('COMMIT');
    
    console.log('\n✅ All data tables truncated successfully (including migrations)!');
    console.log('📝 Note: Table structures are preserved. You can now start fresh.');
    console.log('⚠️  Migration history cleared. You can re-run migrations if needed.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during truncation:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Export functions
export { truncateAllData, truncateAllIncludingMigrations };

// Run if called directly
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('truncate-all.js') || 
  process.argv[1].replace(/\\/g, '/').endsWith('truncate-all.js')
);

if (isMainModule) {
  const includeMigrations = process.argv.includes('--include-migrations');
  
  if (includeMigrations) {
    truncateAllIncludingMigrations().catch((error) => {
      console.error('Truncation failed:', error);
      process.exit(1);
    });
  } else {
    truncateAllData().catch((error) => {
      console.error('Truncation failed:', error);
      process.exit(1);
    });
  }
}

