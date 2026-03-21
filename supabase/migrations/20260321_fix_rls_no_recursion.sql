-- FIX URGENT : suppression de la policy RLS récursive qui bloquait tous les SELECT
-- Le self-join community_members → community_members causait une récursion infinie
-- Solution : fonction SECURITY DEFINER (bypass RLS dans la fonction, pas de récursion)

-- ─── Nettoyage des policies cassées ──────────────────────────────────────────
DROP POLICY IF EXISTS "owner_or_moderator_can_update_members" ON community_members;
DROP POLICY IF EXISTS "public_members_readable"               ON community_members;
DROP POLICY IF EXISTS "public members are readable"           ON community_members;
DROP POLICY IF EXISTS "community_members_select"              ON community_members;
DROP POLICY IF EXISTS "community_members_update"              ON community_members;

-- ─── Fonction helper (SECURITY DEFINER = bypass RLS, pas de récursion) ───────
CREATE OR REPLACE FUNCTION is_moderator_of(p_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND profile_id   = auth.uid()
      AND role         = 'moderator'
  );
$$;

-- ─── SELECT : qui peut lire community_members ─────────────────────────────────
CREATE POLICY "community_members_select"
ON community_members
FOR SELECT
USING (
  -- 1. Membre public dans une communauté publique (visiteurs anonymes, vitrine)
  (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
        AND privacy = 'public'
    )
  )
  OR
  -- 2. L'owner de la communauté voit tous ses membres
  EXISTS (
    SELECT 1 FROM communities
    WHERE id      = community_members.community_id
      AND owner_id = auth.uid()
  )
  OR
  -- 3. Chaque membre voit sa propre ligne
  profile_id = auth.uid()
  OR
  -- 4. Un modérateur actif voit tous les membres (via SECURITY DEFINER)
  is_moderator_of(community_members.community_id)
);

-- ─── UPDATE : owner OU modérateur peut modifier les membres ──────────────────
CREATE POLICY "community_members_update"
ON community_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id      = community_members.community_id
      AND owner_id = auth.uid()
  )
  OR is_moderator_of(community_members.community_id)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM communities
    WHERE id      = community_members.community_id
      AND owner_id = auth.uid()
  )
  OR is_moderator_of(community_members.community_id)
);
