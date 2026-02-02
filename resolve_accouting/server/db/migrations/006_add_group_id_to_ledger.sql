-- Add group_id column to ledger table to link with tally_groups
-- Step 1: Add the column first (without foreign key constraint)
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS group_id INTEGER;

-- Step 2: Add foreign key constraint (only if tally_groups table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tally_groups') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE ledger DROP CONSTRAINT IF EXISTS ledger_group_id_fkey;
        
        -- Add foreign key constraint
        ALTER TABLE ledger 
        ADD CONSTRAINT ledger_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tally_groups(id);
    ELSE
        RAISE NOTICE 'tally_groups table does not exist. Foreign key will be added after creating tally_groups table.';
    END IF;
END $$;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ledger_group_id ON ledger(group_id);

