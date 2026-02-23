-- =============================================================
-- Bürger-App Vorsorge: Citizen Inventory
-- Persönliche Notfallvorrats-Verwaltung mit Ablaufdaten
-- =============================================================

CREATE TABLE IF NOT EXISTS citizen_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Kategorisierung
  category TEXT NOT NULL CHECK (category IN (
    'getraenke', 'lebensmittel', 'hygiene', 'medikamente',
    'notfallausruestung', 'werkzeuge', 'dokumente', 'babybedarf', 'tierbedarf'
  )),
  subcategory TEXT,
  item_name TEXT NOT NULL,

  -- Mengen
  target_qty NUMERIC NOT NULL DEFAULT 0,
  current_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Stk',

  -- Tracking
  expiry_date DATE,
  purchase_date DATE,
  product_name TEXT,
  notes TEXT,

  -- Status
  is_checked BOOLEAN NOT NULL DEFAULT false,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_regional BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance-Indexes
CREATE INDEX idx_citizen_inv_user ON citizen_inventory(user_id);
CREATE INDEX idx_citizen_inv_user_cat ON citizen_inventory(user_id, category);
CREATE INDEX idx_citizen_inv_expiry ON citizen_inventory(user_id, expiry_date)
  WHERE expiry_date IS NOT NULL;

-- Row Level Security
ALTER TABLE citizen_inventory ENABLE ROW LEVEL SECURITY;

-- Benutzer verwalten nur ihr eigenes Inventar
CREATE POLICY "Users manage own citizen inventory"
  ON citizen_inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-Update für updated_at
CREATE OR REPLACE FUNCTION update_citizen_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citizen_inventory_updated
  BEFORE UPDATE ON citizen_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_citizen_inventory_timestamp();
