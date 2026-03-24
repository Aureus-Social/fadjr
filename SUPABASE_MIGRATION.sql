-- Migration: user locations tracking for business analytics
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own location" ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location" ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for city queries (business analytics)
CREATE INDEX idx_user_locations_city ON user_locations(city);
CREATE INDEX idx_user_locations_country ON user_locations(country);

-- View for quick city stats
CREATE OR REPLACE VIEW city_stats AS
SELECT city, country, COUNT(*) as user_count, 
       MAX(last_active) as last_activity
FROM user_locations 
WHERE city IS NOT NULL
GROUP BY city, country
ORDER BY user_count DESC;
