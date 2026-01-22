-- Create organization_tally_config table with profile support
CREATE TABLE IF NOT EXISTS organization_tally_config (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR(255) NOT NULL,
  profile_name VARCHAR(255) NOT NULL,
  tally_company_name VARCHAR(255) NOT NULL,
  tally_ip VARCHAR(255) NOT NULL,
  tally_port INTEGER NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, profile_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_tally_config_org_id ON organization_tally_config(org_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_organization_tally_config_updated_at ON organization_tally_config;
CREATE TRIGGER update_organization_tally_config_updated_at
    BEFORE UPDATE ON organization_tally_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

