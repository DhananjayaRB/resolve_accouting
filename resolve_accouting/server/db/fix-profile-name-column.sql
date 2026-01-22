-- Fix script to add missing profile_name column to organization_tally_config table
-- Run this script if you get "column profile_name does not exist" error

-- Step 1: Add profile_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_tally_config' 
        AND column_name = 'profile_name'
    ) THEN
        -- Add the column
        ALTER TABLE organization_tally_config 
        ADD COLUMN profile_name VARCHAR(255);
        
        -- Set default values for existing rows
        UPDATE organization_tally_config 
        SET profile_name = 'Default Profile ' || id::text 
        WHERE profile_name IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE organization_tally_config 
        ALTER COLUMN profile_name SET NOT NULL;
        
        RAISE NOTICE 'profile_name column added successfully';
    ELSE
        RAISE NOTICE 'profile_name column already exists';
    END IF;
END $$;

-- Step 2: Add tally_company_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_tally_config' 
        AND column_name = 'tally_company_name'
    ) THEN
        ALTER TABLE organization_tally_config 
        ADD COLUMN tally_company_name VARCHAR(255) DEFAULT 'Default Company';
        
        UPDATE organization_tally_config 
        SET tally_company_name = 'Default Company' 
        WHERE tally_company_name IS NULL;
        
        ALTER TABLE organization_tally_config 
        ALTER COLUMN tally_company_name SET NOT NULL;
        
        RAISE NOTICE 'tally_company_name column added successfully';
    ELSE
        RAISE NOTICE 'tally_company_name column already exists';
    END IF;
END $$;

-- Step 3: Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'organization_tally_config_org_id_profile_name_key'
    ) THEN
        ALTER TABLE organization_tally_config 
        ADD CONSTRAINT organization_tally_config_org_id_profile_name_key 
        UNIQUE(org_id, profile_name);
        
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

SELECT 'Fix completed! Table structure is now correct.' AS status;

