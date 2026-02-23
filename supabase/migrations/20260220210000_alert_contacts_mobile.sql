-- Handynummer für Kontakte hinzufügen
ALTER TABLE alert_contacts ADD COLUMN IF NOT EXISTS mobile_phone TEXT;

-- Bestehende phone-Spalte umbenennen für Klarheit (optional kommentieren)
COMMENT ON COLUMN alert_contacts.phone IS 'Festnetznummer';
COMMENT ON COLUMN alert_contacts.mobile_phone IS 'Mobilnummer';
