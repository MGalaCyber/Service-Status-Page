-- ============================================
-- DATABASE SETUP
-- ============================================

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'operational',
  ping_ms FLOAT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service stats table
CREATE TABLE IF NOT EXISTS service_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE UNIQUE,
  stats JSONB DEFAULT '[]'::jsonb,
  oldest_timestamp TIMESTAMPTZ,
  newest_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'investigating',
  impact VARCHAR(50) DEFAULT 'degraded',
  started_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create incident updates table
CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_stats_service_id ON service_stats(service_id);
CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Services are readable by everyone" ON services
  FOR SELECT USING (true);

CREATE POLICY "Stats are readable by everyone" ON service_stats
  FOR SELECT USING (true);

CREATE POLICY "Incidents are readable by everyone" ON incidents
  FOR SELECT USING (true);

CREATE POLICY "Incident updates are readable by everyone" ON incident_updates
  FOR SELECT USING (true);

-- Admin policies
CREATE POLICY "Admin only access services" ON services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin only access incidents" ON incidents
  FOR ALL USING (auth.role() = 'authenticated');

-- Service policies
CREATE POLICY "Only specific admin email" ON services
  FOR ALL USING (auth.email() = 'admin@gmail.com'); -- TODO: Change this to your admin email

-- Initialize stats rows for existing services
INSERT INTO service_stats (service_id, stats, oldest_timestamp, newest_timestamp)
SELECT id, '[]'::jsonb, now(), now() FROM services
ON CONFLICT DO NOTHING;