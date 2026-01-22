-- Create ledger table
CREATE TABLE IF NOT EXISTS ledger (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  financial_year VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ledger_updated_at ON ledger;
CREATE TRIGGER update_ledger_updated_at
    BEFORE UPDATE ON ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
