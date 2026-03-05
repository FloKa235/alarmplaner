-- =============================================================
-- Phase 2: Enterprise BCM Tables
-- Districts extension + 5 new tables for Unternehmen-App
-- =============================================================

-- ─── 1. Extend districts table ─────────────────────────────
ALTER TABLE districts
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'landkreis',
  ADD COLUMN IF NOT EXISTS industry_sector TEXT,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER;

-- ─── 2. business_processes (BIA) ───────────────────────────
CREATE TABLE IF NOT EXISTS business_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  description TEXT,
  criticality TEXT NOT NULL DEFAULT 'mittel'
    CHECK (criticality IN ('kritisch', 'hoch', 'mittel', 'niedrig')),
  rto_hours INTEGER,
  rpo_hours INTEGER,
  mtpd_hours INTEGER,
  dependencies JSONB DEFAULT '[]'::jsonb,
  owner_contact_id UUID REFERENCES alert_contacts(id) ON DELETE SET NULL,
  it_systems TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_processes_district ON business_processes(district_id);

ALTER TABLE business_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bp_select" ON business_processes FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "bp_insert" ON business_processes FOR INSERT
  WITH CHECK (user_has_district_access(district_id));
CREATE POLICY "bp_update" ON business_processes FOR UPDATE
  USING (user_has_district_access(district_id));
CREATE POLICY "bp_delete" ON business_processes FOR DELETE
  USING (user_has_district_access(district_id));

CREATE TRIGGER business_processes_updated
  BEFORE UPDATE ON business_processes
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();

-- ─── 3. compliance_frameworks ──────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  framework_type TEXT NOT NULL
    CHECK (framework_type IN ('nis2', 'kritis_dachg', 'iso_22301', 'bsi_200_4')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  last_audit_date DATE,
  next_audit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_id, framework_type)
);

CREATE INDEX IF NOT EXISTS idx_compliance_fw_district ON compliance_frameworks(district_id);

ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cf_select" ON compliance_frameworks FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "cf_insert" ON compliance_frameworks FOR INSERT
  WITH CHECK (user_has_district_access(district_id));
CREATE POLICY "cf_update" ON compliance_frameworks FOR UPDATE
  USING (user_has_district_access(district_id));
CREATE POLICY "cf_delete" ON compliance_frameworks FOR DELETE
  USING (user_has_district_access(district_id));

-- ─── 4. compliance_requirements ────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen', 'teilweise', 'erfuellt', 'nicht_anwendbar')),
  evidence_document_ids UUID[] DEFAULT '{}',
  evidence_checklist_ids UUID[] DEFAULT '{}',
  evidence_scenario_ids UUID[] DEFAULT '{}',
  responsible TEXT,
  due_date DATE,
  notes TEXT,
  action_href TEXT,
  action_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_req_framework ON compliance_requirements(framework_id);

ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cr_select" ON compliance_requirements FOR SELECT
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks WHERE user_has_district_access(district_id)
  ));
CREATE POLICY "cr_insert" ON compliance_requirements FOR INSERT
  WITH CHECK (framework_id IN (
    SELECT id FROM compliance_frameworks WHERE user_has_district_access(district_id)
  ));
CREATE POLICY "cr_update" ON compliance_requirements FOR UPDATE
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks WHERE user_has_district_access(district_id)
  ));
CREATE POLICY "cr_delete" ON compliance_requirements FOR DELETE
  USING (framework_id IN (
    SELECT id FROM compliance_frameworks WHERE user_has_district_access(district_id)
  ));

CREATE TRIGGER compliance_requirements_updated
  BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();

-- ─── 5. exercises ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'tabletop'
    CHECK (type IN ('tabletop', 'funktionsuebung', 'vollstaendig', 'walkthrough')),
  date_planned DATE,
  date_executed DATE,
  duration_hours NUMERIC,
  participants JSONB DEFAULT '[]'::jsonb,
  objectives TEXT[] DEFAULT '{}',
  findings JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'geplant'
    CHECK (status IN ('geplant', 'durchgefuehrt', 'ausgewertet', 'abgeschlossen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_district ON exercises(district_id);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ex_select" ON exercises FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "ex_insert" ON exercises FOR INSERT
  WITH CHECK (user_has_district_access(district_id));
CREATE POLICY "ex_update" ON exercises FOR UPDATE
  USING (user_has_district_access(district_id));
CREATE POLICY "ex_delete" ON exercises FOR DELETE
  USING (user_has_district_access(district_id));

CREATE TRIGGER exercises_updated
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();

-- ─── 6. supply_dependencies ────────────────────────────────
CREATE TABLE IF NOT EXISTS supply_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'lieferant'
    CHECK (type IN ('lieferant', 'it_system', 'cloud_service', 'versorger', 'dienstleister')),
  name TEXT NOT NULL,
  description TEXT,
  criticality TEXT NOT NULL DEFAULT 'mittel'
    CHECK (criticality IN ('kritisch', 'hoch', 'mittel', 'niedrig')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  sla_hours INTEGER,
  contract_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_deps_district ON supply_dependencies(district_id);

ALTER TABLE supply_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sd_select" ON supply_dependencies FOR SELECT
  USING (user_has_district_access(district_id));
CREATE POLICY "sd_insert" ON supply_dependencies FOR INSERT
  WITH CHECK (user_has_district_access(district_id));
CREATE POLICY "sd_update" ON supply_dependencies FOR UPDATE
  USING (user_has_district_access(district_id));
CREATE POLICY "sd_delete" ON supply_dependencies FOR DELETE
  USING (user_has_district_access(district_id));

CREATE TRIGGER supply_dependencies_updated
  BEFORE UPDATE ON supply_dependencies
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();
