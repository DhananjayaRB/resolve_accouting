-- Migration: Add group_id column to ledger table
-- This script links ledgers to groups from tally_groups table
-- Run this script directly on your PostgreSQL database

-- Step 1: Add group_id column to ledger table
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS group_id INTEGER;

-- Step 2: Add foreign key constraint (only if tally_groups table exists)
-- Note: This will fail if tally_groups table doesn't exist yet
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tally_groups') THEN
        -- Add foreign key constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ledger_group_id_fkey'
        ) THEN
            ALTER TABLE ledger 
            ADD CONSTRAINT ledger_group_id_fkey 
            FOREIGN KEY (group_id) REFERENCES tally_groups(id);
        END IF;
    ELSE
        RAISE NOTICE 'tally_groups table does not exist. Foreign key constraint will be added after creating tally_groups table.';
    END IF;
END $$;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ledger_group_id ON ledger(group_id);

-- Verification
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ledger' AND column_name = 'group_id';

