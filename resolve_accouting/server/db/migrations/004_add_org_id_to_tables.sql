-- Add org_id column to ledger table
ALTER TABLE ledger 
ADD COLUMN IF NOT EXISTS org_id VARCHAR(255);

-- Add org_id column to payrun_ledger_mappings table
ALTER TABLE payrun_ledger_mappings 
ADD COLUMN IF NOT EXISTS org_id VARCHAR(255);

-- Create index on org_id for better query performance
CREATE INDEX IF NOT EXISTS idx_ledger_org_id ON ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_payrun_ledger_mappings_org_id ON payrun_ledger_mappings(org_id);

