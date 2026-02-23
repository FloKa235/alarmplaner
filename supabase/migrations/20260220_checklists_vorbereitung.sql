-- Kategorie 'vorbereitung' zur CHECK-Constraint hinzufügen
-- Für ExTrass-Vorbereitungs-Checklisten pro Szenario

ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_category_check;
ALTER TABLE checklists ADD CONSTRAINT checklists_category_check
  CHECK (category IN ('krisenstab', 'sofortmassnahmen', 'kommunikation', 'nachbereitung', 'custom', 'vorbereitung'));
