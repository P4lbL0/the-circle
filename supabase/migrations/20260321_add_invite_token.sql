-- Ajout d'un token d'invitation cryptographique par communauté
-- Remplace le système précédent où token = slug (prédictible)

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid();

-- Générer un token pour les communautés existantes qui n'en ont pas
UPDATE communities
  SET invite_token = gen_random_uuid()
  WHERE invite_token IS NULL;

-- Rendre la colonne obligatoire
ALTER TABLE communities
  ALTER COLUMN invite_token SET NOT NULL,
  ALTER COLUMN invite_token SET DEFAULT gen_random_uuid();

-- Index pour les lookups rapides sur le token
CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_invite_token
  ON communities (invite_token);
