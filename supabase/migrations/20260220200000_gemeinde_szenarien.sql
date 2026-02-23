-- =============================================
-- Migration: Gemeinde-Szenarien
-- Ermöglicht Bürgermeistern eigene Handlungspläne
-- =============================================

-- 1. Neue Spalte: scenarios.municipality_id
-- NULL = Landkreis-Szenario, gesetzt = Gemeinde-Szenario
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL;

-- 2. Index für Performance
CREATE INDEX IF NOT EXISTS idx_scenarios_municipality ON scenarios(municipality_id) WHERE municipality_id IS NOT NULL;

-- 3. RLS-Policies für scenarios anpassen
-- Bürgermeister dürfen eigene Gemeinde-Szenarien erstellen/bearbeiten

-- SELECT bleibt unverändert: Alle im Landkreis sehen alle Szenarien
-- (existiert bereits als "Users access scenarios via district")

-- Alte Admin-only manage Policy entfernen
DROP POLICY IF EXISTS "Admins manage scenarios" ON scenarios;

-- Neue INSERT Policy: Admin ODER Bürgermeister für eigene Gemeinde
CREATE POLICY "Users insert scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (
    user_is_district_admin(district_id)
    OR (
      -- Bürgermeister darf Gemeinde-Szenarien erstellen
      municipality_id IS NOT NULL
      AND municipality_id = user_municipality_scope(district_id)
    )
  );

-- Neue UPDATE Policy: Admin für alle, Bürgermeister für eigene Gemeinde
CREATE POLICY "Users update scenarios"
  ON scenarios FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR (
      municipality_id IS NOT NULL
      AND municipality_id = user_municipality_scope(district_id)
    )
  )
  WITH CHECK (
    user_is_district_admin(district_id)
    OR (
      municipality_id IS NOT NULL
      AND municipality_id = user_municipality_scope(district_id)
    )
  );

-- Neue DELETE Policy: Admin (außer is_default), Bürgermeister für eigene
CREATE POLICY "Users delete scenarios"
  ON scenarios FOR DELETE
  USING (
    (user_is_district_admin(district_id) AND is_default = false)
    OR (
      municipality_id IS NOT NULL
      AND municipality_id = user_municipality_scope(district_id)
    )
  );

-- 4. scenario_phases: Bürgermeister dürfen Phasen für eigene Szenarien verwalten
DROP POLICY IF EXISTS "Admins manage scenario_phases" ON scenario_phases;

CREATE POLICY "Users manage scenario_phases"
  ON scenario_phases FOR INSERT
  WITH CHECK (scenario_id IN (
    SELECT s.id FROM scenarios s
    WHERE user_is_district_admin(s.district_id)
       OR (s.municipality_id IS NOT NULL AND s.municipality_id = user_municipality_scope(s.district_id))
  ));

CREATE POLICY "Users update scenario_phases"
  ON scenario_phases FOR UPDATE
  USING (scenario_id IN (
    SELECT s.id FROM scenarios s
    WHERE user_is_district_admin(s.district_id)
       OR (s.municipality_id IS NOT NULL AND s.municipality_id = user_municipality_scope(s.district_id))
  ))
  WITH CHECK (scenario_id IN (
    SELECT s.id FROM scenarios s
    WHERE user_is_district_admin(s.district_id)
       OR (s.municipality_id IS NOT NULL AND s.municipality_id = user_municipality_scope(s.district_id))
  ));

CREATE POLICY "Users delete scenario_phases"
  ON scenario_phases FOR DELETE
  USING (scenario_id IN (
    SELECT s.id FROM scenarios s
    WHERE user_is_district_admin(s.district_id)
       OR (s.municipality_id IS NOT NULL AND s.municipality_id = user_municipality_scope(s.district_id))
  ));
