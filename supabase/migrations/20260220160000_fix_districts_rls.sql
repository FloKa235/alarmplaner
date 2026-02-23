-- ============================================
-- FIX: Districts RLS Policies
-- ============================================
-- Die gemeinde_portal Migration hat möglicherweise zu einem
-- inkonsistenten Zustand geführt. Diese Migration stellt sicher,
-- dass der District-Owner weiterhin INSERT/UPDATE/DELETE kann
-- UND Bürgermeister SELECT-Zugriff haben.
-- ============================================

-- Alle existierenden Policies auf districts sicher entfernen
DROP POLICY IF EXISTS "Users manage own districts" ON districts;
DROP POLICY IF EXISTS "Users access own districts" ON districts;

-- Policy 1: Owner hat vollen Zugriff (SELECT + INSERT + UPDATE + DELETE)
-- FOR ALL = deckt alle Operationen ab
-- WITH CHECK wird bei INSERT geprüft → user_id muss auth.uid() sein
CREATE POLICY "Users manage own districts"
  ON districts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 2: Bürgermeister (district_members) dürfen den District LESEN
CREATE POLICY "Members read districts"
  ON districts FOR SELECT
  USING (
    id IN (
      SELECT district_id FROM district_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
