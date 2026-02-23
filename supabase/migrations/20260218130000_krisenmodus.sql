-- ============================================
-- Krisenmodus: District-level crisis state + event timeline
-- ============================================

-- 1. Add crisis columns to districts
ALTER TABLE districts ADD COLUMN IF NOT EXISTS crisis_active BOOLEAN DEFAULT false;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS crisis_scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS crisis_stufe TEXT CHECK (crisis_stufe IN ('vorwarnung', 'teilaktivierung', 'vollaktivierung'));
ALTER TABLE districts ADD COLUMN IF NOT EXISTS crisis_started_at TIMESTAMPTZ;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS crisis_ended_at TIMESTAMPTZ;

-- 2. Create crisis_events table
CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'krise_aktiviert',
    'krise_beendet',
    'stufe_geaendert',
    'alarm_gesendet',
    'massnahme_erledigt',
    'checkliste_aktualisiert',
    'warnung_eingegangen',
    'manueller_eintrag',
    'kontakt_alarmiert',
    'eskalation'
  )),
  beschreibung TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  erstellt_von TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access crisis_events via district"
  ON crisis_events FOR ALL
  USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
  WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));

-- 4. Indexes
CREATE INDEX idx_crisis_events_district ON crisis_events(district_id);
CREATE INDEX idx_crisis_events_created ON crisis_events(created_at DESC);
CREATE INDEX idx_crisis_events_type ON crisis_events(type);
CREATE INDEX idx_districts_crisis_active ON districts(crisis_active) WHERE crisis_active = true;
