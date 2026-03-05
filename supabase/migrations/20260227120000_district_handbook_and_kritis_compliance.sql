-- District Handbooks: Standalone Krisenhandbuch pro Landkreis
-- 12 BSI/BBK-konforme Kapitel, unabhaengig von Szenarien

CREATE TABLE IF NOT EXISTS district_handbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  titel TEXT DEFAULT 'Krisenhandbuch',
  ersteller TEXT,
  version TEXT DEFAULT '1.0',
  gueltig_bis DATE,
  naechste_ueberpruefung DATE,
  freigabe_durch TEXT,
  freigabe_am DATE,
  status TEXT DEFAULT 'entwurf' CHECK (status IN ('entwurf','in_pruefung','freigegeben','archiviert')),
  kapitel JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (district_id)
);

-- Indexes
CREATE INDEX idx_district_handbooks_district ON district_handbooks(district_id);

-- RLS
ALTER TABLE district_handbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read handbooks of their district"
  ON district_handbooks FOR SELECT
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert handbooks for their district"
  ON district_handbooks FOR INSERT
  WITH CHECK (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update handbooks of their district"
  ON district_handbooks FOR UPDATE
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete handbooks of their district"
  ON district_handbooks FOR DELETE
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

-- Erweitere checklists.category CHECK Constraint um 'kritis_compliance'
-- Zuerst alten Constraint entfernen, dann neuen anlegen
ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_category_check;
ALTER TABLE checklists ADD CONSTRAINT checklists_category_check
  CHECK (category IN ('krisenstab', 'sofortmassnahmen', 'kommunikation', 'nachbereitung', 'custom', 'vorbereitung', 'kritis_compliance'));
