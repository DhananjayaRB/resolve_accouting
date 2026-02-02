-- Create tally_sub_groups table for storing sub-groups separately
CREATE TABLE IF NOT EXISTS tally_sub_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  parent_group_id INTEGER NOT NULL, -- References main category/group
  parent_group_name VARCHAR(255), -- Denormalized for easier queries
  group_type VARCHAR(50) DEFAULT 'Secondary',
  alias VARCHAR(255),
  org_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, org_id),
  FOREIGN KEY (parent_group_id) REFERENCES tally_groups(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tally_sub_groups_org_id ON tally_sub_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_tally_sub_groups_parent_group_id ON tally_sub_groups(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_tally_sub_groups_parent_group_name ON tally_sub_groups(parent_group_name);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tally_sub_groups_updated_at ON tally_sub_groups;
CREATE TRIGGER update_tally_sub_groups_updated_at
    BEFORE UPDATE ON tally_sub_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to explain the table
COMMENT ON TABLE tally_sub_groups IS 'Stores sub-groups (groups with parent) separately from main categories';

