# Local Development Database Configuration

## Overview

The application is now configured to use the **production database** for local development by default. This ensures consistency between local and production environments.

## Database Connection Details

- **Host:** `20.204.119.48`
- **Port:** `5432`
- **Database:** `resolve_accouting`
- **User:** `postgres`
- **Password:** `resolve@2022`

## Configuration Files Updated

### 1. `resolve_accouting/server/db/config.js`
- Updated default values to use production database
- Default `DB_HOST`: `20.204.119.48` (was `localhost`)
- Default `DB_NAME`: `resolve_accouting` (was `resolve_accounting`)
- Default `DB_PASSWORD`: `resolve@2022` (was `Resolve@321`)

### 2. `create-env.js`
- Updated `.env` template to use production database settings
- Added optional `DATABASE_URL` connection string

### 3. Documentation
- Updated `SETUP.md` - Removed local PostgreSQL installation requirements
- Updated `QUICKSTART.md` - Updated prerequisites and setup steps

## Environment Variables

### Option 1: Individual Configuration (Default)
```env
DB_USER=postgres
DB_HOST=20.204.119.48
DB_NAME=resolve_accouting
DB_PASSWORD=resolve@2022
DB_PORT=5432
NODE_ENV=development
```

### Option 2: Connection String (Recommended)
```env
DATABASE_URL=postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true
NODE_ENV=development
```

## Setup Steps

1. **Create `.env` file:**
   ```bash
   npm run setup:env
   ```

2. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

## Important Notes

1. **No Local PostgreSQL Required:** You don't need to install PostgreSQL locally anymore.

2. **Network Access:** Ensure your machine has network access to `20.204.119.48:5432`.

3. **Database Already Exists:** The database `resolve_accouting` already exists on the production server, so you don't need to run `db:create`.

4. **Migrations:** Run `npm run db:migrate` to ensure all tables are up to date.

5. **SSL:** SSL is disabled for local development (as specified in connection string with `sslmode=disable`).

## Troubleshooting

### Connection Timeout
- Verify network connectivity to `20.204.119.48`
- Check firewall rules allow connections to port 5432
- Ensure the database server is accessible from your network

### Authentication Failed
- Verify the password is correct: `resolve@2022`
- Check the username is `postgres`
- Ensure the database name is `resolve_accouting` (not `resolve_accounting`)

### Using a Different Database
If you need to use a different database for local development, simply override the environment variables in your `.env` file:

```env
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
```

Or use a different connection string:
```env
DATABASE_URL=postgres://user:password@host:port/database
```

