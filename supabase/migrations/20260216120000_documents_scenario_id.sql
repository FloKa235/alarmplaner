-- ============================================
-- Migration: Dokumente pro Szenario
-- Fügt scenario_id als optionalen FK zu documents hinzu
-- ============================================

ALTER TABLE documents
  ADD COLUMN scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_scenario_id ON documents(scenario_id);

-- Bestehende Dokumente behalten scenario_id = NULL (allgemeine Landkreis-Dokumente)
