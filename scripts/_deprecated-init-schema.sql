-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(50) DEFAULT 'operational',
  ping_ms FLOAT DEFAULT 0,
  response_time_ms FLOAT DEFAULT 0,
  request_count INT DEFAULT 0,
  uptime_percentage FLOAT DEFAULT 100,
  CONSTRAINT service_stats_service_id_timestamp_key UNIQUE(service_id, timestamp)
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
CREATE INDEX IF NOT EXISTS idx_service_stats_timestamp ON service_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read access to services/stats/incidents)
CREATE POLICY "Services are readable by everyone" ON services
  FOR SELECT USING (true);

CREATE POLICY "Stats are readable by everyone" ON service_stats
  FOR SELECT USING (true);

CREATE POLICY "Incidents are readable by everyone" ON incidents
  FOR SELECT USING (true);

CREATE POLICY "Incident updates are readable by everyone" ON incident_updates
  FOR SELECT USING (true);

-- Admin users should have no public access
CREATE POLICY "Admin users are not readable" ON admin_users
  FOR SELECT USING (false);
