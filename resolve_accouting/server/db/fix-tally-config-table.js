import pool from './config.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixTallyConfigTable() {
  const client = await pool.connect();
  
  try {
    console.log('Checking organization_tally_config table structure...');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'organization_tally_config'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Table does not exist. Running migration to create it...');
      // Run the migration to create the table
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'migrations', '002_create_organization_tally_config.sql'),
        'utf8'
      );
      await client.query(migrationSQL);
      console.log('✓ Table created successfully');
      return;
    }
    
    // Check if profile_name column exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_tally_config' 
        AND column_name = 'profile_name'
      );
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('profile_name column does not exist. Adding it...');
      
      // Add profile_name column
      await client.query(`
        ALTER TABLE organization_tally_config 
        ADD COLUMN profile_name VARCHAR(255);
      `);
      
      // Set default values for existing rows
      await client.query(`
        UPDATE organization_tally_config 
        SET profile_name = 'Default Profile ' || id::text 
        WHERE profile_name IS NULL;
      `);
      
      // Make it NOT NULL
      await client.query(`
        ALTER TABLE organization_tally_config 
        ALTER COLUMN profile_name SET NOT NULL;
      `);
      
      // Add unique constraint if it doesn't exist
      const constraintExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_constraint 
          WHERE conname = 'organization_tally_config_org_id_profile_name_key'
        );
      `);
      
      if (!constraintExists.rows[0].exists) {
        await client.query(`
          ALTER TABLE organization_tally_config 
          ADD CONSTRAINT organization_tally_config_org_id_profile_name_key 
          UNIQUE(org_id, profile_name);
        `);
        console.log('✓ Unique constraint added');
      }
      
      console.log('✓ profile_name column added successfully');
    } else {
      console.log('✓ profile_name column already exists');
    }
    
    // Check for tally_company_name column
    const companyNameExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_tally_config' 
        AND column_name = 'tally_company_name'
      );
    `);
    
    if (!companyNameExists.rows[0].exists) {
      console.log('tally_company_name column does not exist. Adding it...');
      await client.query(`
        ALTER TABLE organization_tally_config 
        ADD COLUMN tally_company_name VARCHAR(255) DEFAULT 'Default Company' NOT NULL;
      `);
      console.log('✓ tally_company_name column added successfully');
    } else {
      console.log('✓ tally_company_name column already exists');
    }
    
    console.log('\n✅ Table structure is now correct!');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTallyConfigTable()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

