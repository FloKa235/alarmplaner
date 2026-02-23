-- KRITIS erweitert: Kontaktperson, Betreiberinfos, Notfallbereitschaft
-- =====================================================================

-- Ansprechpartner vor Ort
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Betreiber / Eigentümer
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS operator TEXT;

-- Beschäftigte
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS employee_count INTEGER;

-- Notfallbereitschaft
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS has_emergency_plan BOOLEAN DEFAULT FALSE;
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS emergency_plan_updated_at DATE;
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS emergency_plan_notes TEXT;

-- Redundanz / Resilienz
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS redundancy_level TEXT CHECK (redundancy_level IN ('keine', 'teilweise', 'voll'));
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS has_backup_power BOOLEAN DEFAULT FALSE;

-- Letzte Inspektion / Prüfung
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS last_inspected_at DATE;

-- Kommentare
COMMENT ON COLUMN kritis_sites.contact_name IS 'Ansprechpartner vor Ort (Name)';
COMMENT ON COLUMN kritis_sites.contact_phone IS 'Telefon Ansprechpartner';
COMMENT ON COLUMN kritis_sites.contact_email IS 'E-Mail Ansprechpartner';
COMMENT ON COLUMN kritis_sites.operator IS 'Betreiber / Eigentümer der Infrastruktur';
COMMENT ON COLUMN kritis_sites.employee_count IS 'Anzahl Beschäftigte am Standort';
COMMENT ON COLUMN kritis_sites.has_emergency_plan IS 'Notfallplan vorhanden?';
COMMENT ON COLUMN kritis_sites.emergency_plan_updated_at IS 'Datum der letzten Aktualisierung des Notfallplans';
COMMENT ON COLUMN kritis_sites.emergency_plan_notes IS 'Anmerkungen zum Notfallplan';
COMMENT ON COLUMN kritis_sites.redundancy_level IS 'Redundanzstufe: keine, teilweise, voll';
COMMENT ON COLUMN kritis_sites.has_backup_power IS 'Notstromversorgung vorhanden?';
COMMENT ON COLUMN kritis_sites.last_inspected_at IS 'Letzte Inspektion/Begehung';
