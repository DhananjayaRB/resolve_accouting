import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const { Pool } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testConnection() {
  console.log('🔍 Testing PostgreSQL Connection...\n');
  console.log('Current configuration:');
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'resolve_accounting'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : '(not set)'}\n`);

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'resolve_accounting',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log(`   Server time: ${result.rows[0].now}\n`);
    
    // Test if database exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'resolve_accounting']
    );
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ Database exists');
    } else {
      console.log('⚠️  Database does not exist. Run: npm run db:create');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.code === '28P01') {
      console.log('🔑 This is a password authentication error.');
      console.log('   Your PostgreSQL password doesn\'t match.\n');
      
      const answer = await question('Do you want to try a different password? (y/n): ');
      if (answer.toLowerCase() === 'y') {
        const newPassword = await question('Enter your PostgreSQL password: ');
        
        // Update .env file
        const fs = await import('fs');
        const envPath = '.env';
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
          /DB_PASSWORD=.*/,
          `DB_PASSWORD=${newPassword}`
        );
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Updated .env file with new password');
        console.log('   Please run this script again to test the connection.\n');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  PostgreSQL server is not running or not accessible.');
      console.log('   Please make sure PostgreSQL is running on your system.\n');
    } else if (error.code === '3D000') {
      console.log('⚠️  Database does not exist.');
      console.log('   Run: npm run db:create\n');
    }
    
    await pool.end();
    rl.close();
    process.exit(1);
  }
}

testConnection();

