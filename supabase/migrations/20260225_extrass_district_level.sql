-- Migration: ExTrass-Checklisten von Szenario-Ebene auf Landkreis-Ebene heben
-- Vorher: category='vorbereitung' mit scenario_id gesetzt (pro Szenario)
-- Nachher: category='vorbereitung' mit scenario_id=NULL (pro Landkreis)

-- Schritt 1: Duplikate entfernen – pro (district_id, title) bei vorbereitung
-- nur die Checkliste mit den meisten bearbeiteten Items behalten
DELETE FROM checklists
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY district_id, title
        ORDER BY (
          SELECT COUNT(*)
          FROM jsonb_array_elements(items) AS item
          WHERE item->>'status' != 'open'
        ) DESC, created_at ASC
      ) AS rn
    FROM checklists
    WHERE category = 'vorbereitung'
  ) ranked
  WHERE rn > 1
);

-- Schritt 2: Alle verbleibenden vorbereitung-Checklisten auf Landkreis-Ebene setzen
UPDATE checklists
SET scenario_id = NULL, updated_at = now()
WHERE category = 'vorbereitung' AND scenario_id IS NOT NULL;
