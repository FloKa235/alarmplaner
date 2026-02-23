-- Bürger-App: Alle authentifizierten Benutzer können Warnungen lesen
-- Warnungen sind öffentliche Informationen (NINA, DWD, Pegel) und sollen
-- auch für Privatnutzer verfügbar sein, die nicht District-Admin oder -Member sind.

-- Neue SELECT-Policy für alle authentifizierten User
CREATE POLICY "Authenticated users can read all warnings"
  ON external_warnings FOR SELECT
  USING (auth.role() = 'authenticated');
