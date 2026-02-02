-- Ensure org_id column exists and is properly indexed in ledger table
-- This migration is safe to run multiple times

-- Step 1: Add org_id column if it doesn't exist
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS org_id VARCHAR(255);

-- Step 2: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ledger_org_id ON ledger(org_id);

-- Step 3: Add unique constraint on (name, org_id) if it doesn't exist
-- This ensures each ledger name is unique per organization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ledger_name_org_id_key'
    ) THEN
        ALTER TABLE ledger 
        ADD CONSTRAINT ledger_name_org_id_key 
        UNIQUE(name, org_id);
    END IF;
END $$;

-- Verification
SELECT 
    'ledger.org_id column' AS column_info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ledger' AND column_name = 'org_id';

