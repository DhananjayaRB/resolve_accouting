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