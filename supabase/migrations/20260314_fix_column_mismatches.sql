-- Migration : Corrections des colonnes manquantes / incompatibles
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Date : 14 Mars 2026

-- ─────────────────────────────────────────────────────────────
-- 1. tournament_participants : ajouter colonne `name`
--    Le code ajoute des participants par nom libre (sans compte)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE tournament_participants
  ADD COLUMN IF NOT EXISTS name text;

-- Rendre profile_id nullable (participants sans compte utilisateur)
ALTER TABLE tournament_participants
  ALTER COLUMN profile_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Fonction RPC : add_member_points
--    Utilisée dans BetsClient.tsx pour redistribuer les points
--    après résolution d'un pari
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_member_points(
  p_community_id uuid,
  p_profile_id   uuid,
  p_points       int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_members
  SET points = COALESCE(points, 0) + p_points
  WHERE community_id = p_community_id
    AND profile_id   = p_profile_id;
END;
$$;
