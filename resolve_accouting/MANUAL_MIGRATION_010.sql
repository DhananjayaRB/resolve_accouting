-- ============================================
-- Migration 010: Add parent_group_id to tally_groups
-- Multi-Level Subgroup Support
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Connect to your PostgreSQL database
-- 2. Select the database: resolve_accouting
-- 3. Copy and paste this entire script
-- 4. Execute the script
--
-- Database: resolve_accouting
-- Host: 20.204.119.48
-- Port: 5432
-- User: postgres
-- ============================================

-- Step 1: Add parent_group_id column (nullable, will be populated in step 3)
ALTER TABLE tally_groups 
ADD COLUMN IF NOT EXISTS parent_group_id INTEGER;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tally_groups_parent_group_id ON tally_groups(parent_group_id);

-- Step 3: Migrate existing data from parent_group (name) to parent_group_id
-- This updates all existing subgroups to use parent_group_id instead of parent_group name
UPDATE tally_groups tg1
SET parent_group_id = tg2.id
FROM tally_groups tg2
WHERE tg1.parent_group IS NOT NULL 
  AND tg1.parent_group != ''
  AND tg1.parent_group_id IS NULL
  AND tg2.name = tg1.parent_group
  AND tg2.org_id = tg1.org_id;

-- Step 4: Add foreign key constraint (self-referential)
-- This ensures referential integrity for multi-level hierarchies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tally_groups_parent_group_id_fkey'
  ) THEN
    ALTER TABLE tally_groups
    ADD CONSTRAINT tally_groups_parent_group_id_fkey
    FOREIGN KEY (parent_group_id) 
    REFERENCES tally_groups(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Add comment to explain the column
COMMENT ON COLUMN tally_groups.parent_group_id IS 'References parent group ID for multi-level subgroup hierarchies. NULL for top-level groups.';

-- ============================================
-- VERIFICATION QUERIES (Optional - Run to verify)
-- ============================================

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tally_groups' 
AND column_name = 'parent_group_id';

-- Check if foreign key exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'tally_groups' 
AND constraint_name = 'tally_groups_parent_group_id_fkey';

-- Check if index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tally_groups' 
AND indexname = 'idx_tally_groups_parent_group_id';

-- Count groups with parent_group_id populated
SELECT 
    COUNT(*) as total_groups,
    COUNT(parent_group_id) as groups_with_parent_id,
    COUNT(*) - COUNT(parent_group_id) as root_groups
FROM tally_groups;

-- ============================================
-- NOTES:
-- - The parent_group (VARCHAR) column is kept for backward compatibility
-- - All new operations should use parent_group_id instead of parent_group
-- - This migration is idempotent - safe to run multiple times
-- ============================================

