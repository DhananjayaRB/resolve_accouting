import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runScript(scriptPath) {
  // Use pathToFileURL to handle paths with spaces properly
  const fullPath = resolve(__dirname, scriptPath);
  const scriptUrl = pathToFileURL(fullPath).href;
  
  try {
    // Dynamically import the module
    const module = await import(scriptUrl);
    
    // If the module exports a function, call it
    if (scriptPath === 'create-db.js' && module.createDatabase) {
      await module.createDatabase();
    } else if (scriptPath === 'migrate-all.js' && module.runMigrations) {
      await module.runMigrations();
    }
    // If no export, the module should have run on import (for backward compatibility)
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
      throw new Error(`Failed to load script: ${scriptPath}\n${error.message}`);
    }
    throw error;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Step 1: Create database
    console.log('📦 Step 1: Creating database...');
    const createDbPath = resolve(__dirname, 'create-db.js');
    try {
      await runScript(createDbPath);
      console.log('✓ Database creation completed\n');
    } catch (error) {
      // If database already exists, that's okay
      if (error.stdout && error.stdout.includes('already exists')) {
        console.log('✓ Database already exists\n');
      } else {
        throw error;
      }
    }

    // Step 2: Run migrations
    console.log('📦 Step 2: Running migrations...');
    const migratePath = resolve(__dirname, 'migrate-all.js');
    await runScript(migratePath);
    console.log('✓ Migrations completed\n');

    console.log('✅ Database setup completed successfully!');
    console.log('\nYou can now start the application with:');
    console.log('  npm run dev');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.stdout) console.error('Output:', error.stdout);
    if (error.stderr) console.error('Error:', error.stderr);
    process.exit(1);
  }
}

setupDatabase();

