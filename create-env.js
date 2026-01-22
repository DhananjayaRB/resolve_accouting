import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=resolve_accounting
DB_PASSWORD=postgres
DB_PORT=5432

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

