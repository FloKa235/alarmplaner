-- Add scale_type column to citizen_inventory
-- per_person = consumable items that scale with time (water, food, etc.)
-- per_household = fixed equipment items (flashlight, radio, etc.) that do NOT scale with time

ALTER TABLE citizen_inventory
  ADD COLUMN IF NOT EXISTS scale_type TEXT NOT NULL DEFAULT 'per_person'
  CHECK (scale_type IN ('per_person', 'per_household'));

-- Update existing items that are known per_household items based on BBK templates
-- These items should NOT be multiplied by the zeitraum factor
UPDATE citizen_inventory SET scale_type = 'per_household' WHERE item_name IN (
  -- Getränke
  'Wasserkanister (faltbar)',
  'Entkeimungstabletten',
  'Wasserbehälter für Brauchwasser',
  -- Lebensmittel
  'Gewürze (Grundset)',
  -- Hygiene
  'Müllbeutel (auch große/stabile)',
  'Waschmittel',
  'Haushaltspapier (Küchenrolle)',
  'Haushaltshandschuhe',
  'Campingtoilette',
  -- Medikamente (all per_household except personal meds)
  'Schmerzmittel (Ibuprofen/Paracetamol)',
  'Fiebersenkende Mittel',
  'Fieberthermometer',
  'Wunddesinfektionsmittel',
  'Hautdesinfektionsmittel',
  'Pflaster und Verbandsmaterial',
  'Verbandtuch für Brandwunden',
  'Einmalhandschuhe',
  'Kühlkompresse',
  'Pinzette',
  'Schere',
  'Brand-, Wund-, Heilsalbe',
  'Mittel gegen Durchfall, Erbrechen und Übelkeit',
  'Mittel gegen Erkältungsbeschwerden',
  'Elektrolyte zum Ausgleich von Flüssigkeitsverlust',
  'Mittel gegen Sonnenbrand und Insektenstiche',
  'Abschwellendes Gel für Sportverletzungen',
  'Abschwellende Nasentropfen/Nasenspray',
  -- Notfallausrüstung
  'Taschenlampe (LED)',
  'Batterien (AA/AAA Vorrat)',
  'Kerzen + Streichhölzer/Feuerzeuge',
  'Netzunabhängige Heizgelegenheit',
  'Brennstoffe für Heizgelegenheit',
  'Kurbelradio (UKW/DAB+)',
  'Powerbank (mind. 10.000 mAh)',
  'Warn-App installiert (NINA)',
  'Campingkocher + Gaskartuschen',
  'Brennstoffe für Kochgelegenheit (Gas)',
  'Essgeschirr (Camping)',
  'Rauchmelder',
  'Feuerlöscher/Feuerlöschspray',
  'Kohlenmonoxid-Melder',
  -- Werkzeuge
  'Multitool/Taschenmesser',
  'Dosenöffner (manuell)',
  'Klebeband/Panzertape',
  'Seil (10m)',
  'Abdeckfolie/Plane',
  'Campinglaterne',
  'Kabelbinder (Sortiment)',
  'Notizblock und Stift',
  -- Dokumente
  'Mappe mit wichtigen Dokumenten',
  'Bargeld (kleine Scheine + Münzen)',
  'Impfausweis-Kopien',
  'Notfall-Kontaktliste (ausgedruckt)',
  -- Babybedarf
  'Fläschchen + Schnuller',
  'Babypflegetücher',
  -- Tierbedarf (all per_household)
  'Tierfutter (Trocken)',
  'Tierfutter (Nass)',
  'Trinkwasser für Tiere',
  'Leine + Halsband',
  'Transportbox',
  'Kot-/Streubeutel',
  'Tiermedikamente (Vorrat)',
  'Impfpass-Kopie (Tier)'
);
