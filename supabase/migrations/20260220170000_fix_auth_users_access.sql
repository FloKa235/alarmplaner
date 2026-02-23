-- ============================================
-- FIX: "permission denied for table users"
-- ============================================
-- Problem: district_members_select Policy greift auf auth.users zu.
-- Der anon/authenticated Postgres-Role hat keinen Zugriff auf auth.users.
-- Lösung: auth.jwt() ->> 'email' statt SELECT email FROM auth.users
-- ============================================

-- 1. district_members SELECT Policy fixen
DROP POLICY IF EXISTS "district_members_select" ON district_members;
CREATE POLICY "district_members_select"
  ON district_members FOR SELECT
  USING (
    user_has_district_access(district_id)
    OR (invited_email = (auth.jwt() ->> 'email') AND status = 'invited')
  );

-- 2. Sicherstellen dass die Members-read-districts Policy korrekt ist
-- (nutzt district_members, deren Policy jetzt auth.jwt() statt auth.users nutzt)
DROP POLICY IF EXISTS "Members read districts" ON districts;
CREATE POLICY "Members read districts"
  ON districts FOR SELECT
  USING (
    id IN (
      SELECT district_id FROM district_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
