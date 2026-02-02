-- Complete Migration Script for Tally Groups and Ledger Group Linking
-- Run this script on your PostgreSQL database: resolve_accouting
-- 
-- Usage:
-- psql -h 20.204.119.48 -U postgres -d resolve_accouting -f RUN_MIGRATIONS.sql
-- OR
-- Connect to database and paste this entire script

-- ============================================
-- Migration 005: Create tally_groups table
-- ============================================
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

-- Create trigger for updated_at (if function doesn't exist, create it first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tally_groups_updated_at ON tally_groups;
CREATE TRIGGER update_tally_groups_updated_at
    BEFORE UPDATE ON tally_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration 006: Add group_id to ledger table
-- ============================================
-- Step 1: Add group_id column
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS group_id INTEGER;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tally_groups') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE ledger DROP CONSTRAINT IF EXISTS ledger_group_id_fkey;
        
        -- Add foreign key constraint
        ALTER TABLE ledger 
        ADD CONSTRAINT ledger_group_id_fkey 
        FOREIGN KEY (group_id) REFERENCES tally_groups(id);
        
        RAISE NOTICE 'Foreign key constraint added successfully.';
    ELSE
        RAISE WARNING 'tally_groups table does not exist. Please run Migration 005 first.';
    END IF;
END $$;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ledger_group_id ON ledger(group_id);

-- ============================================
-- Verification
-- ============================================
SELECT 'Migration completed!' AS status;

-- Verify tally_groups table
SELECT 
    'tally_groups table' AS table_name,
    COUNT(*) AS row_count
FROM information_schema.tables 
WHERE table_name = 'tally_groups';

-- Verify group_id column in ledger table
SELECT 
    'ledger.group_id column' AS column_info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ledger' AND column_name = 'group_id';

-- ============================================
-- Migration 007: Ensure org_id in ledger table
-- ============================================
-- Step 1: Add org_id column if it doesn't exist
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS org_id VARCHAR(255);

-- Step 2: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ledger_org_id ON ledger(org_id);

-- Step 3: Add unique constraint on (name, org_id) if it doesn't exist
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

-- Final Verification
SELECT 
    'ledger.org_id column' AS column_info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ledger' AND column_name = 'org_id';

