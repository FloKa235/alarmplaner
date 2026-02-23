-- ─────────────────────────────────────────────────────────
-- Nachbarschafts-Netzwerk (opt-in Community für Krisenfall)
-- ─────────────────────────────────────────────────────────

-- Nachbarschafts-Profile (opt-in)
CREATE TABLE IF NOT EXISTS neighborhood_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  district_id UUID REFERENCES districts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Hilfe-Anfragen/Angebote (im Krisenfall)
CREATE TABLE IF NOT EXISTS neighborhood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES neighborhood_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'request')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE neighborhood_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhood_requests ENABLE ROW LEVEL SECURITY;

-- Profile: Eigenes lesen/schreiben
CREATE POLICY "Users can manage own profile" ON neighborhood_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Profile: Aktive Profile lesen
CREATE POLICY "Users can read active profiles" ON neighborhood_profiles
  FOR SELECT USING (is_active = true);

-- Requests: Eigene verwalten
CREATE POLICY "Users can manage own requests" ON neighborhood_requests
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM neighborhood_profiles WHERE user_id = auth.uid()
    )
  );

-- Requests: Alle lesen
CREATE POLICY "Users can read all requests" ON neighborhood_requests
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_neighborhood_profiles_user ON neighborhood_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_neighborhood_profiles_location ON neighborhood_profiles(lat, lng) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_neighborhood_profiles_district ON neighborhood_profiles(district_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_neighborhood_requests_profile ON neighborhood_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_neighborhood_requests_active ON neighborhood_requests(is_resolved, created_at DESC);
