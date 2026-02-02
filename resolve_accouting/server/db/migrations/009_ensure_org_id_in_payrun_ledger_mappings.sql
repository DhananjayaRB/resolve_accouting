-- Ensure org_id column exists in payrun_ledger_mappings table
ALTER TABLE payrun_ledger_mappings 
ADD COLUMN IF NOT EXISTS org_id VARCHAR(255);

-- Create index on org_id for better query performance
CREATE INDEX IF NOT EXISTS idx_payrun_ledger_mappings_org_id ON payrun_ledger_mappings(org_id);

-- Add unique constraint on (payroll_item_id, ledger_head_id, financial_year, org_id) to prevent duplicates per organization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payrun_ledger_mappings_unique_per_org'
    ) THEN
        ALTER TABLE payrun_ledger_mappings 
        ADD CONSTRAINT payrun_ledger_mappings_unique_per_org 
        UNIQUE(payroll_item_id, ledger_head_id, financial_year, org_id);
    END IF;
END $$;

