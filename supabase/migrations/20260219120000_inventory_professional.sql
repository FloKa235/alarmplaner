-- Inventar-Verwaltung professionalisieren:
-- Neue Spalten für Kategorie, Priorität, Preis, Gemeinde
-- Junction-Table für Szenario-Zuordnung (many-to-many)

-- 1. Neue Spalten in inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS kategorie TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS priority TEXT
  CHECK (priority IN ('kritisch', 'hoch', 'mittel', 'niedrig'));
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,2);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS municipality_id UUID
  REFERENCES municipalities(id) ON DELETE SET NULL;

-- 2. Junction-Table: Inventar ↔ Szenarien (many-to-many)
CREATE TABLE IF NOT EXISTS inventory_scenario_links (
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (inventory_item_id, scenario_id)
);

ALTER TABLE inventory_scenario_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access inventory_scenario_links via inventory item"
  ON inventory_scenario_links FOR ALL
  USING (inventory_item_id IN (
    SELECT ii.id FROM inventory_items ii
    JOIN districts d ON d.id = ii.district_id
    WHERE d.user_id = auth.uid()
  ))
  WITH CHECK (inventory_item_id IN (
    SELECT ii.id FROM inventory_items ii
    JOIN districts d ON d.id = ii.district_id
    WHERE d.user_id = auth.uid()
  ));

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_kategorie ON inventory_items(kategorie);
CREATE INDEX IF NOT EXISTS idx_inventory_items_priority ON inventory_items(priority);
CREATE INDEX IF NOT EXISTS idx_inventory_items_municipality ON inventory_items(municipality_id);
CREATE INDEX IF NOT EXISTS idx_inv_scenario_links_item ON inventory_scenario_links(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_scenario_links_scenario ON inventory_scenario_links(scenario_id);
