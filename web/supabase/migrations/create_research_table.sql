-- Create research_results table
CREATE TABLE research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('perplexity-only', 'perplexity-claude')),
  summary TEXT NOT NULL,
  findings JSONB NOT NULL,
  cost JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_research_created_at ON research_results(created_at DESC);

-- Enable RLS (Row Level Security) - allow all for now (can restrict later)
ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON research_results
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to auto-delete records older than 30 days
CREATE OR REPLACE FUNCTION delete_old_research()
RETURNS void AS $$
BEGIN
  DELETE FROM research_results
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run cleanup daily (optional - can also be done via cron)
-- For now, we'll just call the function in the backend when needed
