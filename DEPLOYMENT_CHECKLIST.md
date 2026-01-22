# Vercel Deployment Checklist

## ✅ Completed Setup

1. ✅ Created `vercel.json` configuration
2. ✅ Converted Express routes to Vercel serverless functions
3. ✅ Created API functions in `/api` directory:
   - `/api/ledgers.js`
   - `/api/payroll-mappings.js`
   - `/api/organisation.js`
   - `/api/tally/test.js`
   - `/api/tally/push.js`
   - `/api/tally/config/[org_id].js`
   - `/api/tally/config/index.js`
   - `/api/tally/sync-ledgers.js`
4. ✅ Updated database config to support connection strings (Vercel Postgres)
5. ✅ Added CORS headers to all API functions
6. ✅ Created deployment documentation

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Database (choose one)
DATABASE_URL=postgresql://user:pass@host:port/db
# OR
POSTGRES_URL=postgresql://user:pass@host:port/db
# OR individual config
DB_HOST=your-host
DB_PORT=5432
DB_NAME=your-db
DB_USER=your-user
DB_PASSWORD=your-password

# Optional
NODE_ENV=production
TALLY_IP=localhost
TALLY_PORT=9000
```

### 2. Database Migration

**Before first deployment:**
- Run migrations locally or use a migration script
- Ensure all tables are created:
  - `ledger`
  - `payrun_ledger_mappings`
  - `organization_tally_config`

### 3. Build Configuration

Vercel will automatically detect:
- Framework: Vite
- Build Command: `npm run build` (runs in `resolve_accouting/`)
- Output Directory: `resolve_accouting/dist`

### 4. API Routes

All API routes are now serverless functions:
- Frontend calls: `/api/ledgers` → `api/ledgers.js`
- All routes support CORS
- All routes handle OPTIONS for preflight

## 🚀 Deployment Steps

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to project
cd resolve_accouting

# Deploy
vercel

# Production deploy
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import Git repository
3. Configure:
   - **Root Directory**: `resolve_accouting`
   - **Framework Preset**: Vite
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
4. Add environment variables
5. Deploy

## 🔍 Post-Deployment Verification

1. **Check Frontend**: Visit your Vercel URL
2. **Test API Endpoints**:
   - `https://your-app.vercel.app/api/ledgers` (GET)
   - `https://your-app.vercel.app/api/organisation` (GET)
   - `https://your-app.vercel.app/api/payroll-mappings` (GET)

3. **Check Function Logs**: Vercel Dashboard → Functions → View Logs

## ⚠️ Important Notes

1. **External API Calls**: Some components still call `https://uat-api.resolveindia.com`. These need to be updated to use relative URLs or environment variables.

2. **Database Connection**: 
   - For Vercel Postgres: Use `POSTGRES_URL` or `DATABASE_URL`
   - For external PostgreSQL: Ensure SSL is enabled
   - Connection pooling is handled automatically

3. **File Structure**: 
   - API functions must be in `resolve_accouting/api/`
   - Frontend code in `resolve_accouting/src/`
   - Build output in `resolve_accouting/dist/`

4. **CORS**: Already configured in all API functions

## 🐛 Troubleshooting

### API Routes Return 404
- Check file names match route structure
- Ensure files are in `api/` directory
- Check Vercel function logs

### Database Connection Fails
- Verify environment variables are set
- Check database allows connections from Vercel IPs
- Ensure SSL is configured for production databases

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

## 📚 Additional Resources

- Full deployment guide: See `VERCEL_DEPLOYMENT.md`
- Vercel Docs: https://vercel.com/docs
- Serverless Functions: https://vercel.com/docs/functions

