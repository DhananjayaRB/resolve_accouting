# Running Migration 010: Add parent_group_id to tally_groups

This migration adds support for multi-level subgroups in the tally_groups table.

## Option 1: Run via Node.js Script (Recommended)

From the project root directory:

```bash
cd resolve_accouting
node server/db/run-single-migration.js 010_add_parent_group_id_to_tally_groups.sql
```

Make sure your `.env` file has the correct database connection settings:
```env
DB_USER=postgres
DB_HOST=20.204.119.48
DB_NAME=resolve_accouting
DB_PASSWORD=resolve@2022
DB_PORT=5432
```

## Option 2: Run via psql (Command Line)

If you have `psql` installed and can connect to the database:

```bash
psql -h 20.204.119.48 -U postgres -d resolve_accouting -f server/db/migrations/010_add_parent_group_id_to_tally_groups.sql
```

Or connect first and then run:

```bash
psql -h 20.204.119.48 -U postgres -d resolve_accouting
```

Then paste the SQL content from `server/db/migrations/010_add_parent_group_id_to_tally_groups.sql`

## Option 3: Run via pgAdmin or Database Client

1. Connect to your PostgreSQL database:
   - Host: `20.204.119.48`
   - Port: `5432`
   - Database: `resolve_accouting`
   - Username: `postgres`
   - Password: `resolve@2022`

2. Open a Query Window

3. Copy and paste the SQL from `server/db/migrations/010_add_parent_group_id_to_tally_groups.sql`

4. Execute the query

## What This Migration Does

1. **Adds `parent_group_id` column** - Allows subgroups to reference their parent group by ID
2. **Creates index** - For faster lookups on parent_group_id
3. **Migrates existing data** - Converts existing parent_group (name) references to parent_group_id
4. **Adds foreign key constraint** - Ensures referential integrity for multi-level hierarchies
5. **Adds documentation** - Comments explaining the column purpose

## Verification

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tally_groups' 
AND column_name = 'parent_group_id';

-- Check if foreign key exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'tally_groups' 
AND constraint_name = 'tally_groups_parent_group_id_fkey';

-- Check if data was migrated
SELECT COUNT(*) as groups_with_parent_id 
FROM tally_groups 
WHERE parent_group_id IS NOT NULL;
```

## Notes

- The `parent_group` (VARCHAR) column is kept for backward compatibility
- All new operations should use `parent_group_id` instead of `parent_group`
- The migration is idempotent - safe to run multiple times

