-- Auto-Refresh: last_auto_refresh Spalte für Districts
ALTER TABLE districts ADD COLUMN IF NOT EXISTS last_auto_refresh TIMESTAMPTZ;

-- Pflicht-Szenarien: is_default Spalte für Scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
