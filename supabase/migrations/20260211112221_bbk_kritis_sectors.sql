-- Restructure KRITIS categories to BBK sectors
-- Drop old constraint and add BBK sector-based categories
ALTER TABLE kritis_sites DROP CONSTRAINT IF EXISTS kritis_sites_category_check;
ALTER TABLE kritis_sites ADD CONSTRAINT kritis_sites_category_check CHECK (category IN (
  -- Sektor 1: Energie
  'kraftwerk','umspannwerk','solarpark','windkraftanlage','transformator','tankstelle',
  -- Sektor 2: Wasser
  'wasserwerk','wasserturm','hochbehaelter','klaerwerk','pumpstation','quelle',
  -- Sektor 3: Ernährung
  'supermarkt','nahversorger','marktplatz','bauernhof',
  -- Sektor 4: Gesundheit
  'krankenhaus','klinik','apotheke','arztpraxis','seniorenheim','zahnarzt',
  -- Sektor 5: Transport
  'bahnhof','haltepunkt','busbahnhof','flugplatz','hubschrauberlandeplatz',
  -- Sektor 6: IT/Telekommunikation
  'funkmast','funkturm','vermittlungsstelle',
  -- Sektor 7: Finanz
  'bank','geldautomat',
  -- Sektor 8: Staat/Verwaltung
  'rathaus','feuerwehr','polizei','gericht','gefaengnis','behoerde',
  -- Sektor 9: Medien/Kultur
  'bibliothek','theater','kino','buergerhaus','sendeturm',
  -- Sektor 10: Gefahrstoffe (manuell)
  'gefahrstoffbetrieb',
  -- Sektor 11: Wasserbau
  'staudamm','wehr','deich',
  -- Sektor 12: Militär
  'militaergebiet','kaserne',
  -- Legacy + Sonstiges
  'schule','kindergarten','bruecke','sonstiges'
));

-- Add sector column for BBK sector grouping
ALTER TABLE kritis_sites ADD COLUMN IF NOT EXISTS sector TEXT;
