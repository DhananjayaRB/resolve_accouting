CREATE TABLE IF NOT EXISTS payrun_ledger_mappings (
    id SERIAL PRIMARY KEY,
    payroll_item_id VARCHAR(255) NOT NULL,
    payroll_item_name VARCHAR(255) NOT NULL,
    ledger_head_id VARCHAR(255) NOT NULL,
    ledger_head_name VARCHAR(255) NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at (if function doesn't exist, it will be created by ledger migration)
DROP TRIGGER IF EXISTS update_payrun_ledger_mappings_updated_at ON payrun_ledger_mappings;
CREATE TRIGGER update_payrun_ledger_mappings_updated_at
    BEFORE UPDATE ON payrun_ledger_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

