-- Krisenstabs-Checklisten für Pro-Version
-- Vordefinierte + benutzerdefinierte Checklisten mit Status-Tracking

CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('krisenstab', 'sofortmassnahmen', 'kommunikation', 'nachbereitung', 'custom')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items: [{ "id": "uuid", "text": "...", "status": "open"|"done"|"skipped", "completed_at": null|"iso", "completed_by": null|"name" }]
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_checklists_district ON checklists(district_id);
CREATE INDEX idx_checklists_scenario ON checklists(scenario_id) WHERE scenario_id IS NOT NULL;

-- RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read checklists of their district"
  ON checklists FOR SELECT
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert checklists for their district"
  ON checklists FOR INSERT
  WITH CHECK (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update checklists of their district"
  ON checklists FOR UPDATE
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete checklists of their district"
  ON checklists FOR DELETE
  USING (district_id IN (
    SELECT id FROM districts WHERE user_id = auth.uid()
  ));
