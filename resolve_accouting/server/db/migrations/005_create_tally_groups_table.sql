-- Create tally_groups table
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

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tally_groups_updated_at ON tally_groups;
CREATE TRIGGER update_tally_groups_updated_at
    BEFORE UPDATE ON tally_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

