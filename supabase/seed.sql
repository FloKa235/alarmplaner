-- ============================================
-- Alarmplaner – Seed Data
-- ============================================
-- ANLEITUNG:
-- 1. Zuerst schema.sql ausführen (✅ erledigt)
-- 2. Einen Account erstellen und Onboarding durchlaufen (✅ erledigt)
-- 3. Dieses SQL im Supabase SQL Editor ausführen
--    → Es findet automatisch deinen District!
-- ============================================

DO $$
DECLARE
  v_district_id UUID;
  v_musterstadt_id UUID;
  v_elbdorf_id UUID;
  v_nordheim_id UUID;
  v_waldau_id UUID;
  v_bergstadt_id UUID;
  v_seehausen_id UUID;
  v_risk_profile_id UUID;
  v_scenario1_id UUID;
  v_scenario2_id UUID;
  v_scenario3_id UUID;
  v_scenario4_id UUID;
  v_scenario5_id UUID;
  v_scenario6_id UUID;
BEGIN

-- ===================
-- 0. BESTEHENDEN DISTRICT FINDEN
-- ===================
-- Findet den ersten (neuesten) District in der DB.
-- Da du nur einen Account hast, ist das dein Landkreis Harz.
SELECT id INTO v_district_id
FROM districts
ORDER BY created_at DESC
LIMIT 1;

IF v_district_id IS NULL THEN
  RAISE EXCEPTION 'Kein District gefunden! Bitte zuerst Onboarding durchlaufen.';
END IF;

RAISE NOTICE 'Verwende District: %', v_district_id;

-- ===================
-- 1. MUNICIPALITIES (6 Gemeinden – Harz-Region)
-- ===================
INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Wernigerode', 32800, 170.3, 51.835, 10.785, 'mittel', 42)
RETURNING id INTO v_musterstadt_id;

INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Quedlinburg', 24200, 78.1, 51.790, 11.148, 'hoch', 72)
RETURNING id INTO v_elbdorf_id;

INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Halberstadt', 40500, 142.9, 51.896, 11.048, 'niedrig', 18)
RETURNING id INTO v_nordheim_id;

INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Blankenburg', 20100, 149.5, 51.792, 10.959, 'erhöht', 55)
RETURNING id INTO v_waldau_id;

INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Oberharz am Brocken', 10200, 164.0, 51.756, 10.678, 'mittel', 38)
RETURNING id INTO v_bergstadt_id;

INSERT INTO municipalities (district_id, name, population, area_km2, latitude, longitude, risk_level, risk_score)
VALUES
  (v_district_id, 'Thale', 17500, 137.8, 51.749, 11.038, 'niedrig', 12)
RETURNING id INTO v_seehausen_id;

-- ===================
-- 2. KRITIS SITES (10 Objekte)
-- ===================
INSERT INTO kritis_sites (district_id, municipality_id, name, category, latitude, longitude, address, risk_exposure) VALUES
  (v_district_id, v_musterstadt_id, 'Harzklinikum Wernigerode', 'krankenhaus', 51.837, 10.790, 'Ilsenburger Str. 15', 'mittel'),
  (v_district_id, v_musterstadt_id, 'Grundschule Stadtfeld', 'schule', 51.833, 10.778, 'Feldstr. 5', 'niedrig'),
  (v_district_id, v_elbdorf_id, 'Feuerwache Quedlinburg', 'feuerwehr', 51.789, 11.152, 'Carl-Ritter-Str. 2', 'hoch'),
  (v_district_id, v_nordheim_id, 'Umspannwerk Halberstadt-Ost', 'umspannwerk', 51.900, 11.060, 'Industriestr. 20', 'erhöht'),
  (v_district_id, v_elbdorf_id, 'Klärwerk Bode-Süd', 'klaerwerk', 51.782, 11.140, 'Am Klärwerk 1', 'hoch'),
  (v_district_id, v_elbdorf_id, 'Bodebrücke B6', 'bruecke', 51.788, 11.155, 'B6', 'hoch'),
  (v_district_id, v_nordheim_id, 'Wasserwerk Halberstadt-Nord', 'wasserwerk', 51.905, 11.045, 'Wasserstr. 8', 'mittel'),
  (v_district_id, v_musterstadt_id, 'Rathaus Wernigerode', 'rathaus', 51.835, 10.785, 'Marktplatz 1', 'niedrig'),
  (v_district_id, v_waldau_id, 'Gymnasium Blankenburg', 'schule', 51.793, 10.962, 'Schulstr. 10', 'niedrig'),
  (v_district_id, v_bergstadt_id, 'Rettungswache Elbingerode', 'feuerwehr', 51.763, 10.726, 'Hauptstr. 55', 'mittel');

-- ===================
-- 3. RISK PROFILE + ENTRIES
-- ===================
INSERT INTO risk_profiles (district_id, risk_score, risk_level)
VALUES (v_district_id, 42, 'mittel')
RETURNING id INTO v_risk_profile_id;

INSERT INTO risk_entries (risk_profile_id, type, score, level, trend, description) VALUES
  (v_risk_profile_id, 'Hochwasser', 72, 'hoch', '+5', 'Bode-Hochwasser mit steigender Tendenz durch Schneeschmelze im Harz'),
  (v_risk_profile_id, 'Sturm', 45, 'mittel', '-2', 'Saisonale Sturmgefahr im Normalbereich'),
  (v_risk_profile_id, 'Waldbrand', 38, 'mittel', '+8', 'Zunehmende Trockenperioden im Harz erhöhen das Risiko'),
  (v_risk_profile_id, 'Stromausfall', 25, 'niedrig', '0', 'Stabile Versorgungsinfrastruktur'),
  (v_risk_profile_id, 'Extremhitze', 55, 'erhöht', '+12', 'Steigende Temperaturen belasten Infrastruktur und Bevölkerung'),
  (v_risk_profile_id, 'Pandemie', 15, 'niedrig', '-5', 'Aktuelle Lage unauffällig');

-- ===================
-- 4. SCENARIOS + PHASES
-- ===================
INSERT INTO scenarios (district_id, title, type, severity, description, affected_population, is_ai_generated, is_edited, created_at)
VALUES (v_district_id, 'Hochwasser Bode – Stufe 3', 'Hochwasser', 78,
  'Bei einem Hochwasserereignis der Stufe 3 an der Bode werden mehrere Gemeinden im Landkreis Harz betroffen sein. Die Pegelstände überschreiten die kritische Marke von 4,5m. Besonders gefährdet sind Quedlinburg und Thale sowie die KRITIS-Infrastruktur (Klärwerk Bode-Süd, Umspannwerk Halberstadt-Ost). Eine koordinierte Evakuierung von ca. 12.500 Personen ist vorzubereiten.',
  12500, true, false, '2025-02-08')
RETURNING id INTO v_scenario1_id;

INSERT INTO scenario_phases (scenario_id, sort_order, name, duration, tasks) VALUES
  (v_scenario1_id, 0, 'Phase 1: Vorwarnung', '0–6 Stunden',
   ARRAY['Krisenstab aktivieren', 'Wetterlage beobachten und Pegelstände prüfen', 'Bevölkerung über mögliche Gefahr informieren', 'Einsatzkräfte in Bereitschaft versetzen']),
  (v_scenario1_id, 1, 'Phase 2: Akutphase', '6–48 Stunden',
   ARRAY['Evakuierungen in betroffenen Gebieten einleiten', 'Notunterkünfte öffnen und betreiben', 'Sandsacklogistik koordinieren', 'Verkehrslenkung und Straßensperrungen', 'Versorgung sicherstellen (Strom, Wasser, Lebensmittel)']),
  (v_scenario1_id, 2, 'Phase 3: Nachsorge', '48+ Stunden',
   ARRAY['Schadenserhebung durchführen', 'Aufräumarbeiten koordinieren', 'Betroffene bei Rückkehr unterstützen', 'Nachbesprechung und Lessons Learned']);

INSERT INTO scenarios (district_id, title, type, severity, is_ai_generated, created_at)
VALUES
  (v_district_id, 'Großflächiger Stromausfall (>72h)', 'Stromausfall', 65, true, '2025-02-05')
RETURNING id INTO v_scenario2_id;

INSERT INTO scenarios (district_id, title, type, severity, is_ai_generated, created_at)
VALUES
  (v_district_id, 'Waldbrand Harz – Trockenperiode', 'Waldbrand', 55, true, '2025-01-28')
RETURNING id INTO v_scenario3_id;

INSERT INTO scenarios (district_id, title, type, severity, is_ai_generated, created_at)
VALUES
  (v_district_id, 'Sturmtief mit Orkanböen', 'Sturm', 60, false, '2025-01-20')
RETURNING id INTO v_scenario4_id;

INSERT INTO scenarios (district_id, title, type, severity, is_ai_generated, created_at)
VALUES
  (v_district_id, 'Chemie-Unfall Industriepark', 'CBRN', 82, true, '2025-01-15')
RETURNING id INTO v_scenario5_id;

INSERT INTO scenarios (district_id, title, type, severity, is_ai_generated, created_at)
VALUES
  (v_district_id, 'Pandemie – erhöhte Inzidenz', 'Pandemie', 30, true, '2025-01-10')
RETURNING id INTO v_scenario6_id;

-- ===================
-- 5. INVENTORY ITEMS (6 Einträge)
-- ===================
INSERT INTO inventory_items (district_id, category, target_quantity, current_quantity, unit, location) VALUES
  (v_district_id, 'Sandsäcke', 50000, 32000, 'Stück', 'Lager Süd – Quedlinburg'),
  (v_district_id, 'Feldbetten', 500, 480, 'Stück', 'Lager Nord – Halberstadt'),
  (v_district_id, 'Wasserflaschen (1L)', 10000, 8500, 'Flaschen', 'Lager Süd – Quedlinburg'),
  (v_district_id, 'Notstromaggregate', 15, 12, 'Stück', 'Feuerwehr HQ Wernigerode'),
  (v_district_id, 'Decken', 1000, 1100, 'Stück', 'Lager Nord – Halberstadt'),
  (v_district_id, 'Verpflegungspakete', 5000, 2800, 'Pakete', 'DRK Lager Wernigerode');

-- ===================
-- 6. ALERT CONTACTS (5 Kontakte)
-- ===================
INSERT INTO alert_contacts (district_id, name, role, organization, email, phone, groups, is_active) VALUES
  (v_district_id, 'Thomas Weber', 'Kreisbrandmeister', 'Feuerwehr', 'weber@fw-harz.de', '+49 170 1234567', ARRAY['Feuerwehr', 'Krisenstab'], true),
  (v_district_id, 'Anna Schmidt', 'Leiterin Ordnungsamt', 'Kreisverwaltung Harz', 'schmidt@kreis-harz.de', '+49 171 2345678', ARRAY['Krisenstab', 'Verwaltung'], true),
  (v_district_id, 'Dr. Klaus Meyer', 'Amtsarzt', 'Gesundheitsamt Harz', 'meyer@ga-harz.de', '+49 172 3456789', ARRAY['Gesundheit'], true),
  (v_district_id, 'Stefan Braun', 'THW-Ortsbeauftragter', 'THW Wernigerode', 'braun@thw-harz.de', '+49 173 4567890', ARRAY['THW'], false),
  (v_district_id, 'Maria Fischer', 'Geschäftsführerin', 'DRK Kreisverband Harz', 'fischer@drk-harz.de', '+49 174 5678901', ARRAY['DRK', 'Hilfsorganisationen'], true);

-- ===================
-- 7. ALERTS (3 Alarme)
-- ===================
INSERT INTO alerts (district_id, scenario_id, level, title, message, target_groups, status, sent_at) VALUES
  (v_district_id, v_scenario1_id, 3, 'Hochwasserwarnung Bode Stufe 3', 'Sofortige Evakuierungsvorbereitungen einleiten.', ARRAY['Feuerwehr', 'THW'], 'sent', now() - interval '2 hours'),
  (v_district_id, v_scenario4_id, 2, 'Sturmwarnung – Evakuierung vorbereiten', 'Krisenstab soll Evakuierungspläne prüfen.', ARRAY['Krisenstab'], 'acknowledged', now() - interval '6 hours'),
  (v_district_id, v_scenario2_id, 1, 'Stromausfall Bezirk Ost', 'Stadtwerke und Ordnungsamt informiert.', ARRAY['Stadtwerke', 'Ordnungsamt'], 'resolved', now() - interval '1 day');

-- ===================
-- 8. DOCUMENTS (5 Dokumente)
-- ===================
INSERT INTO documents (district_id, name, file_type, size_bytes, category, is_processed, created_at) VALUES
  (v_district_id, 'Krisenhandbuch_Harz_2025.pdf', 'pdf', 2516582, 'Handbuch', true, '2025-02-01'),
  (v_district_id, 'Evakuierungsplan_Quedlinburg.pdf', 'pdf', 1887436, 'Evakuierung', true, '2025-01-28'),
  (v_district_id, 'Inventarliste_Q1_2025.xlsx', 'xlsx', 348160, 'Inventar', false, '2025-01-20'),
  (v_district_id, 'Sirenenstandorte_Harz.png', 'image', 911360, 'Infrastruktur', false, '2025-01-15'),
  (v_district_id, 'Alarmierungsprotokoll_Dez2024.pdf', 'pdf', 573440, 'Protokoll', true, '2024-12-20');

RAISE NOTICE 'Seed-Daten erfolgreich für District % eingefügt!', v_district_id;

END $$;
