-- =============================================================
-- Phase 3: Add organization_id to enterprise + shared tables
-- Allows enterprise module to work independently from districts
-- =============================================================

-- ─── 1. Enterprise-Tabellen: organization_id hinzufuegen ─────

-- business_processes: district_id NOT NULL bleiben (Pro nutzt es noch)
-- organization_id nullable fuer Enterprise-Scope
ALTER TABLE business_processes
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bp_org ON business_processes(organization_id);

ALTER TABLE compliance_frameworks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cf_org ON compliance_frameworks(organization_id);
-- Unique constraint fuer org-scope Frameworks
ALTER TABLE compliance_frameworks
  ADD CONSTRAINT uq_compliance_fw_org UNIQUE (organization_id, framework_type);

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ex_org ON exercises(organization_id);

ALTER TABLE supply_dependencies
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sd_org ON supply_dependencies(organization_id);

-- ─── 2. Shared-Tabellen: organization_id hinzufuegen ────────

ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_scenarios_org ON scenarios(organization_id);

ALTER TABLE alert_contacts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_contacts_org ON alert_contacts(organization_id);

ALTER TABLE checklists
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_checklists_org ON checklists(organization_id);

ALTER TABLE crisis_events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_crisis_events_org ON crisis_events(organization_id);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory_items(organization_id);

-- ─── 3. district_id NOT NULL lockern fuer Enterprise-Tabellen ─
-- Enterprise-Eintraege haben organization_id statt district_id

ALTER TABLE business_processes ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE compliance_frameworks ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE exercises ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE supply_dependencies ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE scenarios ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE alert_contacts ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE checklists ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE crisis_events ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE inventory_items ALTER COLUMN district_id DROP NOT NULL;

-- ─── 4. Erweiterte RLS: organization_id ODER district_id ────

-- business_processes
DROP POLICY IF EXISTS "bp_select" ON business_processes;
DROP POLICY IF EXISTS "bp_insert" ON business_processes;
DROP POLICY IF EXISTS "bp_update" ON business_processes;
DROP POLICY IF EXISTS "bp_delete" ON business_processes;

CREATE POLICY "bp_select" ON business_processes FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "bp_insert" ON business_processes FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "bp_update" ON business_processes FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "bp_delete" ON business_processes FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- compliance_frameworks
DROP POLICY IF EXISTS "cf_select" ON compliance_frameworks;
DROP POLICY IF EXISTS "cf_insert" ON compliance_frameworks;
DROP POLICY IF EXISTS "cf_update" ON compliance_frameworks;
DROP POLICY IF EXISTS "cf_delete" ON compliance_frameworks;

CREATE POLICY "cf_select" ON compliance_frameworks FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cf_insert" ON compliance_frameworks FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cf_update" ON compliance_frameworks FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cf_delete" ON compliance_frameworks FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- compliance_requirements (via framework_id subquery)
DROP POLICY IF EXISTS "cr_select" ON compliance_requirements;
DROP POLICY IF EXISTS "cr_insert" ON compliance_requirements;
DROP POLICY IF EXISTS "cr_update" ON compliance_requirements;
DROP POLICY IF EXISTS "cr_delete" ON compliance_requirements;

CREATE POLICY "cr_select" ON compliance_requirements FOR SELECT
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks
    WHERE (district_id IS NOT NULL AND user_has_district_access(district_id))
       OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  ));
CREATE POLICY "cr_insert" ON compliance_requirements FOR INSERT
  WITH CHECK (framework_id IN (
    SELECT id FROM compliance_frameworks
    WHERE (district_id IS NOT NULL AND user_has_district_access(district_id))
       OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  ));
CREATE POLICY "cr_update" ON compliance_requirements FOR UPDATE
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks
    WHERE (district_id IS NOT NULL AND user_has_district_access(district_id))
       OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  ));
CREATE POLICY "cr_delete" ON compliance_requirements FOR DELETE
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks
    WHERE (district_id IS NOT NULL AND user_has_district_access(district_id))
       OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  ));

-- exercises
DROP POLICY IF EXISTS "ex_select" ON exercises;
DROP POLICY IF EXISTS "ex_insert" ON exercises;
DROP POLICY IF EXISTS "ex_update" ON exercises;
DROP POLICY IF EXISTS "ex_delete" ON exercises;

CREATE POLICY "ex_select" ON exercises FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "ex_insert" ON exercises FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "ex_update" ON exercises FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "ex_delete" ON exercises FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- supply_dependencies
DROP POLICY IF EXISTS "sd_select" ON supply_dependencies;
DROP POLICY IF EXISTS "sd_insert" ON supply_dependencies;
DROP POLICY IF EXISTS "sd_update" ON supply_dependencies;
DROP POLICY IF EXISTS "sd_delete" ON supply_dependencies;

CREATE POLICY "sd_select" ON supply_dependencies FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "sd_insert" ON supply_dependencies FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "sd_update" ON supply_dependencies FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "sd_delete" ON supply_dependencies FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- scenarios (shared table)
DROP POLICY IF EXISTS "scenarios_select" ON scenarios;
DROP POLICY IF EXISTS "scenarios_insert" ON scenarios;
DROP POLICY IF EXISTS "scenarios_update" ON scenarios;
DROP POLICY IF EXISTS "scenarios_delete" ON scenarios;

CREATE POLICY "scenarios_select" ON scenarios FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "scenarios_insert" ON scenarios FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "scenarios_update" ON scenarios FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "scenarios_delete" ON scenarios FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- alert_contacts (shared table)
DROP POLICY IF EXISTS "contacts_select" ON alert_contacts;
DROP POLICY IF EXISTS "contacts_insert" ON alert_contacts;
DROP POLICY IF EXISTS "contacts_update" ON alert_contacts;
DROP POLICY IF EXISTS "contacts_delete" ON alert_contacts;

CREATE POLICY "contacts_select" ON alert_contacts FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "contacts_insert" ON alert_contacts FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "contacts_update" ON alert_contacts FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "contacts_delete" ON alert_contacts FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- crisis_events (shared table)
DROP POLICY IF EXISTS "crisis_events_select" ON crisis_events;
DROP POLICY IF EXISTS "crisis_events_insert" ON crisis_events;

CREATE POLICY "crisis_events_select" ON crisis_events FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "crisis_events_insert" ON crisis_events FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- documents (shared table)
DROP POLICY IF EXISTS "docs_select" ON documents;
DROP POLICY IF EXISTS "docs_insert" ON documents;
DROP POLICY IF EXISTS "docs_update" ON documents;
DROP POLICY IF EXISTS "docs_delete" ON documents;

CREATE POLICY "docs_select" ON documents FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "docs_insert" ON documents FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "docs_update" ON documents FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "docs_delete" ON documents FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- inventory_items (shared table)
DROP POLICY IF EXISTS "inv_select" ON inventory_items;
DROP POLICY IF EXISTS "inv_insert" ON inventory_items;
DROP POLICY IF EXISTS "inv_update" ON inventory_items;
DROP POLICY IF EXISTS "inv_delete" ON inventory_items;

CREATE POLICY "inv_select" ON inventory_items FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "inv_insert" ON inventory_items FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "inv_update" ON inventory_items FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "inv_delete" ON inventory_items FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );

-- checklists (shared table)
DROP POLICY IF EXISTS "cl_select" ON checklists;
DROP POLICY IF EXISTS "cl_insert" ON checklists;
DROP POLICY IF EXISTS "cl_update" ON checklists;
DROP POLICY IF EXISTS "cl_delete" ON checklists;

CREATE POLICY "cl_select" ON checklists FOR SELECT
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cl_insert" ON checklists FOR INSERT
  WITH CHECK (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cl_update" ON checklists FOR UPDATE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
CREATE POLICY "cl_delete" ON checklists FOR DELETE
  USING (
    (district_id IS NOT NULL AND user_has_district_access(district_id))
    OR (organization_id IS NOT NULL AND user_has_org_access(organization_id))
  );
