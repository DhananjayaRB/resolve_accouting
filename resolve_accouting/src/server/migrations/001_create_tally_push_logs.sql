-- Create tally_push_logs table
CREATE TABLE IF NOT EXISTS tally_push_logs (
    id SERIAL PRIMARY KEY,
    xml_data TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    response_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_tally_push_logs_created_at ON tally_push_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tally_push_logs_updated_at
    BEFORE UPDATE ON tally_push_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 