-- Gemeinde-Alarmierung: Bürgermeister können Alarme auslösen
-- Eskalation: Gemeinde → Landkreis → Behörden
-- =====================================================================

-- Neue Spalte: Welche Gemeinde hat den Alarm ausgelöst?
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_municipality_id UUID REFERENCES municipalities(id);

-- Neue Spalte: Wurde der Alarm zum Landkreis eskaliert?
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;

-- Neue Spalte: Quelle des Alarms (landkreis = vom Admin, gemeinde = vom Bürgermeister)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'landkreis'
  CHECK (source IN ('landkreis', 'gemeinde'));

-- Kommentare
COMMENT ON COLUMN alerts.source_municipality_id IS 'Gemeinde, die den Alarm ausgelöst hat (NULL bei Landkreis-Alarm)';
COMMENT ON COLUMN alerts.is_escalated IS 'Wurde der Alarm an den Landkreis eskaliert?';
COMMENT ON COLUMN alerts.source IS 'Quelle: landkreis (Admin) oder gemeinde (Bürgermeister)';

-- Index für schnelle Abfrage
CREATE INDEX IF NOT EXISTS idx_alerts_source_municipality ON alerts(source_municipality_id);
CREATE INDEX IF NOT EXISTS idx_alerts_source ON alerts(source);

-- RLS: Bürgermeister dürfen Alarme inserieren (für ihre Gemeinde)
DROP POLICY IF EXISTS "Buergermeister can create alerts" ON alerts;
CREATE POLICY "Buergermeister can create alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    -- Muss district_member sein
    user_has_district_access(district_id)
    AND
    -- source_municipality_id muss der eigenen Gemeinde entsprechen
    source_municipality_id = user_municipality_scope(district_id)
    AND
    -- Muss als 'gemeinde' markiert sein
    source = 'gemeinde'
  );

-- Bürgermeister dürfen ihre eigenen Alarme auch updaten (z.B. abschließen)
DROP POLICY IF EXISTS "Buergermeister can update own alerts" ON alerts;
CREATE POLICY "Buergermeister can update own alerts"
  ON alerts FOR UPDATE
  USING (
    user_has_district_access(district_id)
    AND source_municipality_id = user_municipality_scope(district_id)
    AND source = 'gemeinde'
  )
  WITH CHECK (
    user_has_district_access(district_id)
    AND source_municipality_id = user_municipality_scope(district_id)
    AND source = 'gemeinde'
  );
