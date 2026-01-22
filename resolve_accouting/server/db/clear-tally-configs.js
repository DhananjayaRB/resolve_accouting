import pool from './config.js';
import dotenv from 'dotenv';

dotenv.config();

async function clearTallyConfigs() {
  try {
    console.log('Clearing all Tally configuration data...');
    
    const result = await pool.query('DELETE FROM organization_tally_config');
    
    console.log(`✓ Deleted ${result.rowCount} Tally configuration(s)`);
    console.log('✓ All Tally configurations cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing Tally configs:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearTallyConfigs()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

