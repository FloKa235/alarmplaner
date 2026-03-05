-- Krisenstab-Mitglieder: S1-S6 Rollen + Leiter pro Landkreis
-- Unterstützt sowohl Kontakt-Verknüpfung als auch manuelle Eingabe

CREATE TABLE krisenstab_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  rolle TEXT NOT NULL CHECK (rolle IN ('S1','S2','S3','S4','S5','S6','Leiter')),
  ist_stellvertreter BOOLEAN DEFAULT false,
  contact_id UUID REFERENCES alert_contacts(id) ON DELETE SET NULL,
  name TEXT,
  telefon TEXT,
  email TEXT,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE krisenstab_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "krisenstab_members_district" ON krisenstab_members
  FOR ALL USING (
    district_id IN (SELECT id FROM districts WHERE user_id = auth.uid())
  );

CREATE INDEX idx_krisenstab_district ON krisenstab_members(district_id);
CREATE INDEX idx_krisenstab_rolle ON krisenstab_members(district_id, rolle);
