-- Plan-Metadaten: updated_at Spalte für Szenarien
-- Automatisches Tracking der letzten Änderung

ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Bestehende Zeilen: updated_at = created_at setzen
UPDATE scenarios SET updated_at = created_at WHERE updated_at IS NULL;

-- Auto-Update Trigger: updated_at wird bei jedem UPDATE automatisch gesetzt
CREATE OR REPLACE FUNCTION update_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scenarios_updated_at ON scenarios;
CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_scenarios_updated_at();
