-- ============================================
-- Gemeinde-Portal: Multi-User + Rollen-System
-- ============================================
-- Ermöglicht Landkreis-Admins, Bürgermeister einzuladen.
-- Bürgermeister erhalten eingeschränkten Zugriff auf ihre Gemeinde.
-- ============================================

-- =============================================
-- TEIL 1: Neue Tabellen
-- =============================================

-- 1a. district_members — Verknüpft User mit Landkreisen und optional Gemeinden
CREATE TABLE IF NOT EXISTS district_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'buergermeister')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  UNIQUE(user_id, district_id)
);

CREATE INDEX IF NOT EXISTS idx_district_members_user ON district_members(user_id);
CREATE INDEX IF NOT EXISTS idx_district_members_district ON district_members(district_id);
CREATE INDEX IF NOT EXISTS idx_district_members_municipality ON district_members(municipality_id);
CREATE INDEX IF NOT EXISTS idx_district_members_status ON district_members(status);
CREATE INDEX IF NOT EXISTS idx_district_members_email ON district_members(invited_email) WHERE invited_email IS NOT NULL;

-- 1b. incident_reports — Notfall-Meldungen von Bürgermeistern
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE NOT NULL,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('niedrig', 'mittel', 'hoch', 'kritisch')),
  category TEXT CHECK (category IN ('infrastruktur', 'naturereignis', 'versorgung', 'sicherheit', 'gesundheit', 'sonstiges')),
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt', 'abgelehnt')),
  admin_notes TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_district ON incident_reports(district_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_municipality ON incident_reports(municipality_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created ON incident_reports(created_at DESC);

-- 1c. Neue Spalte: checklists.municipality_id (für Gemeinde-spezifische Checklisten)
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_checklists_municipality ON checklists(municipality_id) WHERE municipality_id IS NOT NULL;


-- =============================================
-- TEIL 2: RLS-Hilfsfunktionen
-- =============================================

-- Prüft ob der aktuelle User Zugriff auf einen Landkreis hat
-- (als Owner via districts.user_id ODER als aktives Mitglied via district_members)
CREATE OR REPLACE FUNCTION user_has_district_access(p_district_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM districts WHERE id = p_district_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM district_members
    WHERE district_id = p_district_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Gibt die municipality_id zurück, wenn der User ein Bürgermeister ist (sonst NULL)
CREATE OR REPLACE FUNCTION user_municipality_scope(p_district_id UUID)
RETURNS UUID AS $$
  SELECT dm.municipality_id
  FROM district_members dm
  WHERE dm.district_id = p_district_id
    AND dm.user_id = auth.uid()
    AND dm.role = 'buergermeister'
    AND dm.status = 'active'
  LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Prüft ob der User Admin eines Landkreises ist (Owner oder Admin-Mitglied)
CREATE OR REPLACE FUNCTION user_is_district_admin(p_district_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM districts WHERE id = p_district_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM district_members
    WHERE district_id = p_district_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- =============================================
-- TEIL 3: RLS für neue Tabellen
-- =============================================

ALTER TABLE district_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- district_members: Admin sieht alle Mitglieder, Bürgermeister nur sich selbst
CREATE POLICY "district_members_select"
  ON district_members FOR SELECT
  USING (
    user_has_district_access(district_id)
    OR (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'invited')
  );

CREATE POLICY "district_members_insert"
  ON district_members FOR INSERT
  WITH CHECK (user_is_district_admin(district_id));

CREATE POLICY "district_members_update"
  ON district_members FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "district_members_delete"
  ON district_members FOR DELETE
  USING (user_is_district_admin(district_id));

-- incident_reports: Alle im Landkreis können lesen, Bürgermeister können erstellen, Admin kann updaten
CREATE POLICY "incident_reports_select"
  ON incident_reports FOR SELECT
  USING (user_has_district_access(district_id));

CREATE POLICY "incident_reports_insert"
  ON incident_reports FOR INSERT
  WITH CHECK (
    user_has_district_access(district_id)
    AND reported_by = auth.uid()
  );

CREATE POLICY "incident_reports_update"
  ON incident_reports FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR reported_by = auth.uid()
  );

CREATE POLICY "incident_reports_delete"
  ON incident_reports FOR DELETE
  USING (user_is_district_admin(district_id));


-- =============================================
-- TEIL 4: Bestehende RLS-Policies updaten
-- =============================================
-- Alle Policies auf user_has_district_access() umstellen
-- damit Bürgermeister-Mitglieder auch Leserechte bekommen.

-- 4a. districts
DROP POLICY IF EXISTS "Users manage own districts" ON districts;
CREATE POLICY "Users access own districts"
  ON districts FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (SELECT district_id FROM district_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "Users manage own districts"
  ON districts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4b. municipalities
DROP POLICY IF EXISTS "Users access municipalities via district" ON municipalities;
CREATE POLICY "Users access municipalities via district"
  ON municipalities FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage municipalities"
  ON municipalities FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4c. kritis_sites
DROP POLICY IF EXISTS "Users access kritis_sites via district" ON kritis_sites;
CREATE POLICY "Users read kritis_sites via district"
  ON kritis_sites FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Users write kritis_sites"
  ON kritis_sites FOR INSERT
  WITH CHECK (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );
CREATE POLICY "Users update kritis_sites"
  ON kritis_sites FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );
CREATE POLICY "Users delete kritis_sites"
  ON kritis_sites FOR DELETE
  USING (user_is_district_admin(district_id));

-- 4d. risk_profiles
DROP POLICY IF EXISTS "Users access risk_profiles via district" ON risk_profiles;
CREATE POLICY "Users access risk_profiles via district"
  ON risk_profiles FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage risk_profiles"
  ON risk_profiles FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4e. risk_entries (indirekt über risk_profiles)
DROP POLICY IF EXISTS "Users access risk_entries via profile" ON risk_entries;
CREATE POLICY "Users access risk_entries via profile"
  ON risk_entries FOR SELECT
  USING (risk_profile_id IN (
    SELECT rp.id FROM risk_profiles rp WHERE user_has_district_access(rp.district_id)
  ));
CREATE POLICY "Admins manage risk_entries"
  ON risk_entries FOR ALL
  USING (risk_profile_id IN (
    SELECT rp.id FROM risk_profiles rp WHERE user_is_district_admin(rp.district_id)
  ))
  WITH CHECK (risk_profile_id IN (
    SELECT rp.id FROM risk_profiles rp WHERE user_is_district_admin(rp.district_id)
  ));

-- 4f. scenarios
DROP POLICY IF EXISTS "Users access scenarios via district" ON scenarios;
CREATE POLICY "Users access scenarios via district"
  ON scenarios FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage scenarios"
  ON scenarios FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4g. scenario_phases (indirekt über scenarios)
DROP POLICY IF EXISTS "Users access scenario_phases via scenario" ON scenario_phases;
CREATE POLICY "Users access scenario_phases via scenario"
  ON scenario_phases FOR SELECT
  USING (scenario_id IN (
    SELECT s.id FROM scenarios s WHERE user_has_district_access(s.district_id)
  ));
CREATE POLICY "Admins manage scenario_phases"
  ON scenario_phases FOR ALL
  USING (scenario_id IN (
    SELECT s.id FROM scenarios s WHERE user_is_district_admin(s.district_id)
  ))
  WITH CHECK (scenario_id IN (
    SELECT s.id FROM scenarios s WHERE user_is_district_admin(s.district_id)
  ));

-- 4h. inventory_items
DROP POLICY IF EXISTS "Users access inventory_items via district" ON inventory_items;
CREATE POLICY "Users read inventory_items via district"
  ON inventory_items FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Users write inventory_items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );
CREATE POLICY "Users update inventory_items"
  ON inventory_items FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );
CREATE POLICY "Users delete inventory_items"
  ON inventory_items FOR DELETE
  USING (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );

-- 4i. inventory_scenario_links (indirekt über inventory_items)
DROP POLICY IF EXISTS "Users access inventory_scenario_links via inventory item" ON inventory_scenario_links;
CREATE POLICY "Users access inventory_scenario_links"
  ON inventory_scenario_links FOR SELECT
  USING (inventory_item_id IN (
    SELECT ii.id FROM inventory_items ii WHERE user_has_district_access(ii.district_id)
  ));
CREATE POLICY "Users manage inventory_scenario_links"
  ON inventory_scenario_links FOR ALL
  USING (inventory_item_id IN (
    SELECT ii.id FROM inventory_items ii WHERE user_has_district_access(ii.district_id)
  ))
  WITH CHECK (inventory_item_id IN (
    SELECT ii.id FROM inventory_items ii WHERE user_has_district_access(ii.district_id)
  ));

-- 4j. alert_contacts
DROP POLICY IF EXISTS "Users access alert_contacts via district" ON alert_contacts;
CREATE POLICY "Users access alert_contacts via district"
  ON alert_contacts FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage alert_contacts"
  ON alert_contacts FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4k. alerts
DROP POLICY IF EXISTS "Users access alerts via district" ON alerts;
CREATE POLICY "Users access alerts via district"
  ON alerts FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage alerts"
  ON alerts FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4l. documents
DROP POLICY IF EXISTS "Users access documents via district" ON documents;
CREATE POLICY "Users access documents via district"
  ON documents FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage documents"
  ON documents FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4m. external_warnings
DROP POLICY IF EXISTS "Users access warnings via district" ON external_warnings;
CREATE POLICY "Users access warnings via district"
  ON external_warnings FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage warnings"
  ON external_warnings FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));

-- 4n. checklists (hat separate SELECT/INSERT/UPDATE/DELETE Policies)
DROP POLICY IF EXISTS "Users can read checklists of their district" ON checklists;
DROP POLICY IF EXISTS "Users can insert checklists for their district" ON checklists;
DROP POLICY IF EXISTS "Users can update checklists of their district" ON checklists;
DROP POLICY IF EXISTS "Users can delete checklists of their district" ON checklists;

CREATE POLICY "Users read checklists via district"
  ON checklists FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Users write checklists"
  ON checklists FOR INSERT
  WITH CHECK (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );
CREATE POLICY "Users update checklists"
  ON checklists FOR UPDATE
  USING (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND (municipality_id = user_municipality_scope(district_id) OR municipality_id IS NULL))
  );
CREATE POLICY "Users delete checklists"
  ON checklists FOR DELETE
  USING (
    user_is_district_admin(district_id)
    OR (user_has_district_access(district_id) AND municipality_id = user_municipality_scope(district_id))
  );

-- 4o. crisis_events
DROP POLICY IF EXISTS "Users access crisis_events via district" ON crisis_events;
CREATE POLICY "Users access crisis_events via district"
  ON crisis_events FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "Admins manage crisis_events"
  ON crisis_events FOR ALL
  USING (user_is_district_admin(district_id))
  WITH CHECK (user_is_district_admin(district_id));
