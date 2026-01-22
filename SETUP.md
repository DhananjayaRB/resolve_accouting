# Local Development Setup Guide

This guide will help you set up the Resolve Accounting application to run locally with a PostgreSQL database.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn** package manager
3. **Network access** to the production database server (20.204.119.48)

**Note:** The application is configured to use the production database by default. No local PostgreSQL installation is required.

## Step 1: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database Configuration (Production Database)
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
```

**Note:** The application is configured to use the production database (`20.204.119.48`) by default for both local and production environments.

## Step 3: Install Dependencies

From the root directory, run:

```bash
npm install
```

## Step 4: Set Up the Database

Run the database migrations to create/update the necessary tables:

```bash
npm run db:migrate
```

**Note:** The database already exists on the production server, so `db:create` is not needed. The migrations will create or update tables as needed.

## Step 5: Start the Application

Start both the backend server and frontend development server:

```bash
npm run dev
```

This will start:
- **Backend server** on `http://localhost:3001`
- **Frontend development server** on `http://localhost:3000`

## Step 6: Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start both backend and frontend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run db:create` - Create the database
- `npm run db:migrate` - Run database migrations
- `npm run db:setup` - Complete database setup (create + migrate)

## Database Schema

The application uses the following main tables:

1. **ledger** - Stores ledger/account information
2. **payrun_ledger_mappings** - Maps payroll items to ledger heads
3. **tally_push_logs** - Logs for Tally integration pushes

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   # Check Services for PostgreSQL service
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Verify connection settings in `.env` file**

3. **Test connection manually:**
   ```bash
   psql -U postgres -h localhost -p 5432
   ```

### Port Already in Use

If port 3001 or 3000 is already in use:
- Change `PORT` in `.env` file for backend
- Change port in `vite.config.ts` for frontend

### Migration Errors

If migrations fail:
1. Check that the database exists
2. Verify all migration files are present in `resolve_accouting/server/db/migrations/`
3. Check PostgreSQL logs for detailed error messages

## Development Notes

- The backend server serves the built frontend from the `dist` directory in production mode
- In development, Vite runs the frontend separately with hot module replacement
- Database migrations are tracked in the `schema_migrations` table to prevent duplicate runs

