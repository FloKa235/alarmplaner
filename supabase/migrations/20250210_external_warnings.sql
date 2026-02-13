-- ============================================
-- Migration: External Warnings (NINA/DWD)
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users access warnings via district' AND tablename = 'external_warnings'
  ) THEN
    CREATE POLICY "Users access warnings via district"
      ON external_warnings FOR ALL
      USING (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()))
      WITH CHECK (district_id IN (SELECT id FROM districts WHERE user_id = auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_external_warnings_district ON external_warnings(district_id);
CREATE INDEX IF NOT EXISTS idx_external_warnings_severity ON external_warnings(severity);
CREATE INDEX IF NOT EXISTS idx_external_warnings_expires ON external_warnings(expires_at);

-- AGS-Code und Warncell-ID für Districts
ALTER TABLE districts ADD COLUMN IF NOT EXISTS ags_code TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS warncell_id INTEGER;

-- Seed: AGS-Code für den Harz-Landkreis (Demo-Daten)
UPDATE districts SET ags_code = '15085', warncell_id = 815085 WHERE name ILIKE '%harz%' AND ags_code IS NULL;
