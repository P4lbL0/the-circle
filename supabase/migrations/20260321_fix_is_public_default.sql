-- Fix : is_public false par défaut sur community_members
-- Les membres créés avant ce fix avaient is_public = false,
-- ce qui les rendait invisibles sur la vitrine publique.

-- 1. Mettre tous les membres existants en is_public = true
UPDATE community_members
SET is_public = true
WHERE is_public IS DISTINCT FROM true;

-- 2. Changer le DEFAULT de la colonne pour les futurs inserts
ALTER TABLE community_members
  ALTER COLUMN is_public SET DEFAULT true;
