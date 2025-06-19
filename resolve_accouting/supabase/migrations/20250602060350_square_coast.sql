-- Ledger Heads Table
CREATE TABLE ledger_heads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  financial_year VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Items Table
CREATE TABLE payroll_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Mappings Table
CREATE TABLE payroll_mappings (
  id SERIAL PRIMARY KEY,
  payroll_item_id INTEGER REFERENCES payroll_items(id),
  ledger_head_id INTEGER REFERENCES ledger_heads(id),
  financial_year VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Configurations Table
CREATE TABLE report_configurations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  detail_level VARCHAR(50) NOT NULL,
  include_inactive BOOLEAN DEFAULT false,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Journals Table
CREATE TABLE payroll_journals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  entries JSONB NOT NULL,
  total_debit NUMERIC(15,2) NOT NULL,
  total_credit NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ledger_heads_updated_at
    BEFORE UPDATE ON ledger_heads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_mappings_updated_at
    BEFORE UPDATE ON payroll_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_configurations_updated_at
    BEFORE UPDATE ON report_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();