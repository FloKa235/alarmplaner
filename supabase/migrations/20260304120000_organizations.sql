-- =============================================================
-- Phase 3: Organizations – Eigenstaendiges Enterprise-Datenmodell
-- Neue organizations + organization_sites Tabellen
-- =============================================================

-- ─── 1. organizations (Kern-Tabelle) ─────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_form TEXT,                    -- GmbH, AG, KG, e.K., etc.
  industry_sector TEXT,               -- Branche (NIS2-Sektoren)
  employee_count INTEGER,
  annual_revenue_eur NUMERIC,

  -- NIS2/KRITIS Kategorisierung (berechnet im Onboarding)
  nis2_relevant BOOLEAN NOT NULL DEFAULT false,
  nis2_category TEXT                  -- 'wesentlich' | 'wichtig' | null
    CHECK (nis2_category IS NULL OR nis2_category IN ('wesentlich', 'wichtig')),
  kritis_relevant BOOLEAN NOT NULL DEFAULT false,
  kritis_sector TEXT,                 -- Energie, Wasser, IT, Gesundheit, etc.

  -- Krisenmodus (analog zu districts)
  crisis_active BOOLEAN NOT NULL DEFAULT false,
  crisis_scenario_id UUID,
  crisis_stufe TEXT
    CHECK (crisis_stufe IS NULL OR crisis_stufe IN ('vorwarnung', 'teilaktivierung', 'vollaktivierung')),
  crisis_started_at TIMESTAMPTZ,
  crisis_ended_at TIMESTAMPTZ,

  -- Meta
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_user ON organizations(user_id);

-- Updated-at Trigger (reuse existing function)
CREATE TRIGGER organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();

-- ─── 2. organization_sites (Multi-Standort) ──────────────────
CREATE TABLE IF NOT EXISTS organization_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                 -- z.B. "Hauptsitz Berlin", "RZ Frankfurt"
  address TEXT,
  city TEXT,
  postal_code TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  site_type TEXT NOT NULL DEFAULT 'buero'
    CHECK (site_type IN ('buero', 'rechenzentrum', 'produktion', 'lager', 'sonstiges')),
  employee_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_sites_org ON organization_sites(organization_id);

CREATE TRIGGER organization_sites_updated
  BEFORE UPDATE ON organization_sites
  FOR EACH ROW EXECUTE FUNCTION update_citizen_inventory_timestamp();

-- ─── 3. RLS Function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION user_has_org_access(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 4. RLS Policies: organizations ─────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "org_delete" ON organizations FOR DELETE
  USING (user_id = auth.uid());

-- ─── 5. RLS Policies: organization_sites ────────────────────
ALTER TABLE organization_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_sites_select" ON organization_sites FOR SELECT
  USING (user_has_org_access(organization_id));
CREATE POLICY "org_sites_insert" ON organization_sites FOR INSERT
  WITH CHECK (user_has_org_access(organization_id));
CREATE POLICY "org_sites_update" ON organization_sites FOR UPDATE
  USING (user_has_org_access(organization_id));
CREATE POLICY "org_sites_delete" ON organization_sites FOR DELETE
  USING (user_has_org_access(organization_id));
