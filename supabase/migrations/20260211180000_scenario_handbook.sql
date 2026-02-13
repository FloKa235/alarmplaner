-- ============================================
-- Szenario-Handbuch: JSONB-Spalte für KI-generierte Krisenhandbücher
-- ============================================

ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS handbook JSONB;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_handbook_generated BOOLEAN DEFAULT false;

COMMENT ON COLUMN scenarios.handbook IS 'KI-generiertes Krisenhandbuch (Risikobewertung, Prävention, Kommunikation, Wenn-Dann, Verantwortlichkeiten)';
COMMENT ON COLUMN scenarios.is_handbook_generated IS 'Wurde das Handbuch per KI generiert?';
