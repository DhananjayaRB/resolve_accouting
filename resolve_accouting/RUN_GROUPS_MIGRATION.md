# Running the Tally Groups Migration

## Option 1: Run via psql (Command Line)

If you have `psql` installed and can connect to the database:

```bash
psql -h 20.204.119.48 -U postgres -d resolve_accouting -f server/db/migrations/005_create_tally_groups_table.sql
```

Or connect first and then run:

```bash
psql -h 20.204.119.48 -U postgres -d resolve_accouting
```

Then paste the SQL content:

```sql
-- Create tally_groups table
CREATE TABLE IF NOT EXISTS tally_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  parent_group VARCHAR(255),
  group_type VARCHAR(50),
  alias VARCHAR(255),
  org_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, org_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tally_groups_org_id ON tally_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_tally_groups_parent_group ON tally_groups(parent_group);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tally_groups_updated_at ON tally_groups;
CREATE TRIGGER update_tally_groups_updated_at
    BEFORE UPDATE ON tally_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Option 2: Run via pgAdmin or Database Client

1. Connect to your PostgreSQL database:
   - Host: `20.204.119.48`
   - Port: `5432`
   - Database: `resolve_accouting`
   - Username: `postgres`
   - Password: `resolve@2022`

2. Open a Query Window

3. Copy and paste the SQL from `server/db/migrations/005_create_tally_groups_table.sql`

4. Execute the query

## Option 3: Check Database Connection First

Before running the migration, verify the database exists and is accessible:

```bash
psql -h 20.204.119.48 -U postgres -l
```

This will list all databases. Look for `resolve_accouting` in the list.

If the database doesn't exist, create it first:

```sql
CREATE DATABASE resolve_accouting;
```

## Option 4: Run Migration Script (Once Database is Accessible)

Once the database connection is working:

```bash
cd resolve_accouting
node server/db/run-single-migration.js 005_create_tally_groups_table.sql
```

Or run all migrations:

```bash
cd resolve_accouting
node server/db/migrate-all.js
```

## Troubleshooting Connection Issues

### ECONNRESET Error
This usually means:
- Network connectivity issues
- Firewall blocking the connection
- Database server not accessible from your network
- Connection timeout

**Solutions:**
1. Verify you can ping the server: `ping 20.204.119.48`
2. Check if port 5432 is accessible: `telnet 20.204.119.48 5432`
3. Verify firewall rules allow connections to port 5432
4. Try connecting via a database client (pgAdmin, DBeaver) first to test connectivity

### Database Does Not Exist Error
If you get `database "resolve_accouting" does not exist`:
1. Connect to PostgreSQL as superuser
2. Create the database: `CREATE DATABASE resolve_accouting;`
3. Then run the migration

