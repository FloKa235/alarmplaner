-- Add new KRITIS categories for expanded OSM import
ALTER TABLE kritis_sites DROP CONSTRAINT IF EXISTS kritis_sites_category_check;
ALTER TABLE kritis_sites ADD CONSTRAINT kritis_sites_category_check CHECK (category IN (
  'krankenhaus','klinik','apotheke',
  'schule','kindergarten',
  'feuerwehr','polizei',
  'umspannwerk','klaerwerk','wasserwerk','wasserturm',
  'rathaus','seniorenheim',
  'bahnhof','tankstelle','supermarkt',
  'bruecke','sonstiges'
));
