-- Szenario-Metadaten: Auslösekriterien, Sofortmaßnahmen, Zeitphasen, Prioritäten
-- Gespeichert als JSONB für flexible Struktur ohne Schema-Migration bei Erweiterungen

ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT NULL;

-- Index für schnelle Abfragen auf Meta-Daten
CREATE INDEX IF NOT EXISTS idx_scenarios_meta ON scenarios USING gin (meta) WHERE meta IS NOT NULL;
