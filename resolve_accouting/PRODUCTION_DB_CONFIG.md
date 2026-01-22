# Production Database Configuration

## Production Database Connection

The application is configured to use the following production database:

```
DATABASE_URL=postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true
```

### Connection Details

- **Host:** `20.204.119.48`
- **Port:** `5432`
- **Database:** `resolve_accouting`
- **User:** `postgres`
- **Password:** `resolve@2022` (URL-encoded as `resolve%402022`)
- **SSL Mode:** `disable` (SSL is disabled)
- **Connection Pooling:** `pgbouncer=true` (Using PgBouncer)

## Configuration Behavior

The `resolve_accouting/server/db/config.js` file:

1. **Prioritizes Connection String:** Uses `DATABASE_URL` or `POSTGRES_URL` if available
2. **Respects SSL Mode:** Automatically detects `sslmode=disable` in the connection string and disables SSL
3. **Falls Back to Individual Config:** If no connection string is provided, uses individual `DB_*` environment variables

### SSL Configuration Logic

```javascript
// If sslmode=disable in connection string → SSL = false
// If sslmode=require in connection string → SSL = { rejectUnauthorized: false }
// If no sslmode specified → SSL = false (dev) or { rejectUnauthorized: false } (prod)
```

## Vercel Deployment Setup

### Step 1: Add Environment Variable

In Vercel Dashboard → Settings → Environment Variables → Add:

**Variable Name:** `DATABASE_URL`  
**Value:** `postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true`  
**Environment:** Production (and Preview if needed)

### Step 2: Set Node Environment

**Variable Name:** `NODE_ENV`  
**Value:** `production`  
**Environment:** Production

### Step 3: Verify Connection

After deployment, test the connection by:
1. Checking Vercel function logs for connection errors
2. Testing API endpoints: `/api/ledgers`, `/api/payroll-mappings`
3. Verifying database queries work correctly

## Testing Locally

To test the production connection locally, create a `.env` file:

```bash
DATABASE_URL=postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true
NODE_ENV=production
```

Then test the connection:

```bash
npm run db:test
```

## Important Notes

1. **Password Encoding:** The `@` symbol in the password must be URL-encoded as `%40`
2. **SSL Disabled:** The connection string explicitly sets `sslmode=disable`, which the config respects
3. **PgBouncer:** The `pgbouncer=true` parameter is informational and helps with connection pooling
4. **Security:** Ensure the database firewall allows connections from Vercel's IP ranges

## Troubleshooting

### Connection Timeout
- Verify the database server is accessible from the internet
- Check firewall rules allow connections from Vercel IPs
- Ensure the database is running and accepting connections

### SSL Errors
- The config automatically respects `sslmode=disable` in the connection string
- If you see SSL errors, verify the connection string includes `?sslmode=disable`

### Authentication Failed
- Verify the password is correctly URL-encoded (`%40` for `@`)
- Check the username and database name are correct
- Ensure the user has proper permissions

## Migration

Before deploying to production, ensure migrations are run:

```bash
# Set DATABASE_URL in your environment
export DATABASE_URL="postgres://postgres:resolve%402022@20.204.119.48:5432/resolve_accouting?sslmode=disable&pgbouncer=true"

# Run migrations
npm run db:migrate
```

Or run migrations directly on the production database using a database client.

