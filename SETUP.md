# Local Development Setup Guide

This guide will help you set up the Resolve Accounting application to run locally with a PostgreSQL database.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher) installed and running locally
3. **npm** or **yarn** package manager

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

### Windows:
- Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)
- During installation, remember the password you set for the `postgres` user
- Default port is `5432`

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=resolve_accounting
DB_PASSWORD=postgres
DB_PORT=5432

# Server Configuration
PORT=3001

# Node Environment
NODE_ENV=development
```

**Important:** Update `DB_PASSWORD` with your actual PostgreSQL password if it's different from `postgres`.

## Step 3: Install Dependencies

From the root directory, run:

```bash
npm install
```

## Step 4: Set Up the Database

Run the database setup script which will:
1. Create the database if it doesn't exist
2. Run all migrations to create the necessary tables

```bash
npm run db:setup
```

Alternatively, you can run the steps individually:

```bash
# Create database only
npm run db:create

# Run migrations only
npm run db:migrate
```

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

