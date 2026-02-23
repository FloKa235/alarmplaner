-- Alarmierung: Geltungsbereich (Landkreis vs. Gemeinden)
-- Neue Spalten für Scope-Auswahl bei Alarmen

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'landkreis'
  CHECK (scope IN ('landkreis', 'gemeinden'));

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS municipality_ids UUID[] DEFAULT '{}';

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS municipality_names TEXT[] DEFAULT '{}';
