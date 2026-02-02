-- Migration 010: Add parent_group_id to tally_groups for multi-level subgroup support
-- This allows subgroups to have multiple levels of nesting

-- Step 1: Add parent_group_id column (nullable, will be populated in step 2)
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

-- Note: parent_group (VARCHAR) column is kept for backward compatibility
-- but parent_group_id should be used for all new operations

