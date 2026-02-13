-- ============================================
-- Alarmplaner – Supabase DB Schema
-- ============================================
-- Dieses SQL im Supabase SQL Editor ausführen.
-- Erstellt 11 Tabellen mit RLS, Indizes und Check-Constraints.
-- ============================================

-- ===================
-- 1. DISTRICTS (Landkreise – Tenant-Tabelle)
-- ===================
CREATE TABLE districts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  population INTEGER NOT NULL,
  area_km2 NUMERIC(10,2) NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 2. MUNICIPALITIES (Gemeinden)
-- ===================
CREATE TABLE municipalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  area_km2 NUMERIC(10,2) NOT NULL DEFAULT 0,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('niedrig','mittel','erhöht','hoch','extrem')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 3. KRITIS_SITES (Kritische Infrastruktur)
-- ===================
CREATE TABLE kritis_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'krankenhaus','klinik','apotheke',
    'schule','kindergarten',
    'feuerwehr','polizei',
    'umspannwerk','klaerwerk','wasserwerk','wasserturm',
    'rathaus','seniorenheim',
    'bahnhof','tankstelle','supermarkt',
    'bruecke','sonstiges'
  )),
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  address TEXT,
  risk_exposure TEXT CHECK (risk_exposure IN ('niedrig','mittel','erhöht','hoch','extrem')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 4. RISK_PROFILES (Risikoanalyse pro Landkreis)
-- ===================
CREATE TABLE risk_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('niedrig','mittel','erhöht','hoch','extrem')),
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 5. RISK_ENTRIES (Einzelne Risikokategorien)
-- ===================
CREATE TABLE risk_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_profile_id UUID REFERENCES risk_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  level TEXT CHECK (level IN ('niedrig','mittel','erhöht','hoch','extrem')),
  trend TEXT DEFAULT '0',
  description TEXT
);

-- ===================
-- 6. SCENARIOS (KI-Krisenszenarien)
-- ===================
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  severity INTEGER DEFAULT 0 CHECK (severity BETWEEN 0 AND 100),
  description TEXT,
  affected_population INTEGER,
  is_ai_generated BOOLEAN DEFAULT true,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 7. SCENARIO_PHASES (Handlungsphasen)
-- ===================
CREATE TABLE scenario_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  tasks TEXT[] DEFAULT '{}'
);

-- ===================
-- 8. INVENTORY_ITEMS (Soll/Ist Inventar)
-- ===================
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  target_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 9. ALERT_CONTACTS (Alarmierungskontakte)
-- ===================
CREATE TABLE alert_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  groups TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 10. ALERTS (Gesendete Alarme)
-- ===================
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  level INTEGER CHECK (level IN (1,2,3)) NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  message TEXT,
  target_groups TEXT[] DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft','sent','acknowledged','resolved')) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 11. DOCUMENTS (Hochgeladene Dokumente)
-- ===================
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size_bytes INTEGER,
  category TEXT,
  storage_path TEXT,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kritis_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Districts: User sieht/verwaltet nur eigene Landkreise
CREATE POLICY "Users manage own districts"
  ON districts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Municipalities: über district_id
CREATE POLICY "Users access municipalities via district"
  ON municipalities FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- KRITIS Sites: über district_id
CREATE POLICY "Users access kritis_sites via district"
  ON kritis_sites FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Risk Profiles: über district_id
CREATE POLICY "Users access risk_profiles via district"
  ON risk_profiles FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Risk Entries: über risk_profile → district
CREATE POLICY "Users access risk_entries via profile"
  ON risk_entries FOR ALL
  USING (risk_profile_id IN (
    SELECT rp.id FROM risk_profiles rp
    JOIN districts d ON d.id = rp.district_id
    WHERE d.user_id = auth.uid()
  ))
  WITH CHECK (risk_profile_id IN (
    SELECT rp.id FROM risk_profiles rp
    JOIN districts d ON d.id = rp.district_id
    WHERE d.user_id = auth.uid()
  ));

-- Scenarios: über district_id
CREATE POLICY "Users access scenarios via district"
  ON scenarios FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Scenario Phases: über scenario → district
CREATE POLICY "Users access scenario_phases via scenario"
  ON scenario_phases FOR ALL
  USING (scenario_id IN (
    SELECT s.id FROM scenarios s
    JOIN districts d ON d.id = s.district_id
    WHERE d.user_id = auth.uid()
  ))
  WITH CHECK (scenario_id IN (
    SELECT s.id FROM scenarios s
    JOIN districts d ON d.id = s.district_id
    WHERE d.user_id = auth.uid()
  ));

-- Inventory Items: über district_id
CREATE POLICY "Users access inventory_items via district"
  ON inventory_items FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Alert Contacts: über district_id
CREATE POLICY "Users access alert_contacts via district"
  ON alert_contacts FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Alerts: über district_id
CREATE POLICY "Users access alerts via district"
  ON alerts FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- Documents: über district_id
CREATE POLICY "Users access documents via district"
  ON documents FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));


-- ============================================
-- INDIZES
-- ============================================
CREATE INDEX idx_districts_user ON districts(user_id);
CREATE INDEX idx_municipalities_district ON municipalities(district_id);
CREATE INDEX idx_kritis_sites_district ON kritis_sites(district_id);
CREATE INDEX idx_kritis_sites_municipality ON kritis_sites(municipality_id);
CREATE INDEX idx_risk_profiles_district ON risk_profiles(district_id);
CREATE INDEX idx_risk_entries_profile ON risk_entries(risk_profile_id);
CREATE INDEX idx_scenarios_district ON scenarios(district_id);
CREATE INDEX idx_scenario_phases_scenario ON scenario_phases(scenario_id);
CREATE INDEX idx_inventory_items_district ON inventory_items(district_id);
CREATE INDEX idx_alert_contacts_district ON alert_contacts(district_id);
CREATE INDEX idx_alerts_district ON alerts(district_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_documents_district ON documents(district_id);


-- ============================================
-- 12. EXTERNAL WARNINGS (NINA/DWD Warnungen)
-- ============================================
CREATE TABLE IF NOT EXISTS external_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nina', 'dwd', 'pegel')),
  external_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'extreme')),
  title TEXT NOT NULL,
  description TEXT,
  affected_areas TEXT[],
  effective_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  instruction TEXT,
  raw_data JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, external_id)
);

ALTER TABLE external_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access warnings via district"
  ON external_warnings FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

CREATE INDEX idx_external_warnings_district ON external_warnings(district_id);
CREATE INDEX idx_external_warnings_severity ON external_warnings(severity);
CREATE INDEX idx_external_warnings_expires ON external_warnings(expires_at);

-- AGS-Code und Warncell-ID für Districts
ALTER TABLE districts ADD COLUMN IF NOT EXISTS ags_code TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS warncell_id INTEGER;
