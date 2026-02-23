-- Erweitere inventory_items um Zustand, Letzte Prüfung, Verantwortlich
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('einsatzbereit', 'wartung_noetig', 'defekt'));
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_inspected DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS responsible TEXT;
