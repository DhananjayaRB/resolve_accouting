import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Database Configuration (Production Database)
DB_USER=postgres
DB_HOST=20.204.119.48
DB_NAME=resolve_accouting
DB_PASSWORD=resolve@2022
DB_PORT=5432

# Or use connection string (recommended)
# DATABASE_URL=postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true

# Server Configuration
PORT=3001

# Node Environment
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('   If you want to recreate it, delete the existing file first.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update DB_PASSWORD with your PostgreSQL password if different from "postgres"');
}

