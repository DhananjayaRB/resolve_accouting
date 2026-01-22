# Vercel Deployment Guide

This guide will help you deploy the Resolve Accounting application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (can use Vercel Postgres, Supabase, or any PostgreSQL provider)
3. Node.js 18+ installed locally (for testing)

## Step 1: Prepare Your Database

### Option A: Use Vercel Postgres
1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new Postgres database
4. Note the connection string

### Option B: Use External PostgreSQL
- Use any PostgreSQL provider (Supabase, Railway, AWS RDS, etc.)
- Get your connection string ready

## Step 2: Set Up Environment Variables

In your Vercel project dashboard, go to Settings → Environment Variables and add:

### Required Environment Variables

```bash
# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# Or use a connection string (recommended for Vercel Postgres)
DATABASE_URL=postgresql://user:password@host:port/database

# API Configuration
VITE_API_URL=https://your-app.vercel.app
# Or use relative URLs in production:
# VITE_API_URL=/api

# Tally Configuration (Optional - can be set per organization in the app)
TALLY_IP=localhost
TALLY_PORT=9000

# Node Environment
NODE_ENV=production
```

### For Vercel Postgres

If using Vercel Postgres, you'll get a `POSTGRES_URL` automatically. Update `resolve_accouting/server/db/config.js` to use it:

```javascript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

## Step 3: Database Migration

Before deploying, you need to run database migrations. You have two options:

### Option A: Run Migrations Locally (Before Deployment)

1. Set up your local `.env` file with database credentials
2. Run migrations:
   ```bash
   npm run db:setup
   ```

### Option B: Run Migrations After Deployment

1. Deploy to Vercel first
2. Use Vercel's CLI to run migrations:
   ```bash
   vercel env pull .env.local
   npm run db:migrate
   ```

Or create a one-time migration script that runs on first deployment.

## Step 4: Deploy to Vercel

### Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project root:
   ```bash
   cd resolve_accouting
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `resolve_accouting`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add environment variables (from Step 2)
5. Click Deploy

## Step 5: Update Frontend API URLs

The frontend needs to know where to find the API. Update your API base URL:

### Option 1: Use Relative URLs (Recommended)

In your frontend code, use relative URLs:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

### Option 2: Use Environment Variables

Set `VITE_API_URL` in Vercel environment variables to your production URL.

## Step 6: Verify Deployment

1. Check your deployment URL (e.g., `https://your-app.vercel.app`)
2. Test API endpoints:
   - `https://your-app.vercel.app/api/ledgers`
   - `https://your-app.vercel.app/api/organisation`
3. Test the frontend application

## Project Structure for Vercel

```
resolve_accouting/
├── api/                    # Vercel serverless functions
│   ├── ledgers.js
│   ├── payroll-mappings.js
│   ├── organisation.js
│   └── tally/
│       ├── test.js
│       ├── push.js
│       ├── sync-ledgers.js
│       └── config/
│           ├── index.js
│           └── [org_id].js
├── server/                  # Express server (for local dev)
│   ├── routes/
│   └── db/
├── src/                     # React frontend
├── dist/                    # Build output (generated)
├── vercel.json             # Vercel configuration
└── package.json
```

## API Routes Mapping

| Express Route | Vercel Serverless Function |
|--------------|---------------------------|
| `/api/ledgers` | `/api/ledgers.js` |
| `/api/payroll-mappings` | `/api/payroll-mappings.js` |
| `/api/organisation` | `/api/organisation.js` |
| `/api/tally/test` | `/api/tally/test.js` |
| `/api/tally/push` | `/api/tally/push.js` |
| `/api/tally/config/:org_id` | `/api/tally/config/[org_id].js` |
| `/api/tally/config` | `/api/tally/config/index.js` |
| `/api/tally/sync-ledgers` | `/api/tally/sync-ledgers.js` |

## Troubleshooting

### Database Connection Issues

1. **Connection Timeout**: Ensure your database allows connections from Vercel's IP ranges
2. **SSL Required**: Some databases require SSL in production. Update `config.js`:
   ```javascript
   ssl: { rejectUnauthorized: false }
   ```

### API Routes Not Working

1. Check that files are in the `api/` directory
2. Verify file names match the route structure
3. Check Vercel function logs in the dashboard

### Build Failures

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (should be 18+)

### CORS Issues

CORS headers are already set in each API function. If you still have issues:
1. Check that `Access-Control-Allow-Origin` is set correctly
2. Verify preflight OPTIONS requests are handled

## Database Connection Pooling

For serverless functions, connection pooling is important. The current setup uses `pg.Pool` which works well. For better performance with Vercel, consider:

1. **Vercel Postgres**: Automatically handles connection pooling
2. **PgBouncer**: Use a connection pooler like PgBouncer
3. **Serverless Postgres**: Use services optimized for serverless (e.g., Neon, Supabase)

## Environment-Specific Configuration

### Development
- Uses local PostgreSQL
- API runs on Express server (port 3001)
- Frontend runs on Vite dev server (port 3000)

### Production (Vercel)
- Uses Vercel Postgres or external PostgreSQL
- API runs as serverless functions
- Frontend served as static files

## Next Steps

1. Set up CI/CD with GitHub integration
2. Configure custom domain
3. Set up monitoring and logging
4. Configure database backups
5. Set up staging environment

## Support

For issues:
1. Check Vercel function logs
2. Review database connection logs
3. Test API endpoints individually
4. Check environment variables are set correctly

