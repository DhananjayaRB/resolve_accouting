-- Add profile_name column if it doesn't exist
-- This migration handles the case where the table was created before profile_name was added

-- First, check if column exists and add it if not
DO $$ 
BEGIN
    -- Check if profile_name column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_tally_config' 
        AND column_name = 'profile_name'
    ) THEN
        -- Add profile_name column
        ALTER TABLE organization_tally_config 
        ADD COLUMN profile_name VARCHAR(255);
        
        -- Set a default value for existing rows
        UPDATE organization_tally_config 
        SET profile_name = 'Default Profile ' || id 
        WHERE profile_name IS NULL;
        
        -- Make it NOT NULL after setting defaults
        ALTER TABLE organization_tally_config 
        ALTER COLUMN profile_name SET NOT NULL;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conname = 'organization_tally_config_org_id_profile_name_key'
        ) THEN
            ALTER TABLE organization_tally_config 
            ADD CONSTRAINT organization_tally_config_org_id_profile_name_key 
            UNIQUE(org_id, profile_name);
        END IF;
    END IF;
END $$;

