-- ============================================================
-- Migration : Forum → Système de Chat Groupe
-- Date      : 2026-03-14
-- Description: Remplace forum_categories/forum_threads/forum_posts
--              par chat_groups/chat_messages avec Supabase Realtime
-- ============================================================

-- ── 1. Nouvelles tables ────────────────────────────────────

CREATE TABLE chat_groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name         text        NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  is_public    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid        NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  community_id uuid        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      text        NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Index de performance ────────────────────────────────

CREATE INDEX idx_chat_groups_community     ON chat_groups(community_id);
CREATE INDEX idx_chat_messages_group_time  ON chat_messages(group_id, created_at DESC);
CREATE INDEX idx_chat_messages_community   ON chat_messages(community_id);
CREATE INDEX idx_chat_messages_author      ON chat_messages(author_id);

-- ── 3. Replica identity (pour Realtime DELETE avec filtre) ─

ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- ── 4. Row Level Security ──────────────────────────────────

ALTER TABLE chat_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_groups : lecture (public OU membre de la communauté)
CREATE POLICY "chat_groups_select" ON chat_groups
  FOR SELECT USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_groups.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator', 'member')
    )
  );

-- chat_groups : création (owner communauté OU modérateur)
CREATE POLICY "chat_groups_insert" ON chat_groups
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT owner_id FROM communities WHERE id = chat_groups.community_id)
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_groups.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator')
    )
  );

-- chat_groups : modification (owner communauté OU modérateur)
CREATE POLICY "chat_groups_update" ON chat_groups
  FOR UPDATE USING (
    auth.uid() = (SELECT owner_id FROM communities WHERE id = chat_groups.community_id)
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_groups.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator')
    )
  );

-- chat_groups : suppression (owner communauté OU modérateur)
CREATE POLICY "chat_groups_delete" ON chat_groups
  FOR DELETE USING (
    auth.uid() = (SELECT owner_id FROM communities WHERE id = chat_groups.community_id)
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_groups.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator')
    )
  );

-- chat_messages : lecture (groupe public OU membre)
CREATE POLICY "chat_messages_select" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_groups cg
      WHERE cg.id = chat_messages.group_id
        AND (
          cg.is_public = true
          OR EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = chat_messages.community_id
              AND cm.profile_id   = auth.uid()
              AND cm.role         IN ('owner', 'moderator', 'member')
          )
        )
    )
  );

-- chat_messages : envoi (membres uniquement, auteur = soi-même)
CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_messages.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator', 'member')
    )
  );

-- chat_messages : suppression (auteur OU owner/modérateur)
CREATE POLICY "chat_messages_delete" ON chat_messages
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = chat_messages.community_id
        AND profile_id   = auth.uid()
        AND role         IN ('owner', 'moderator')
    )
  );

-- ── 5. Activer Supabase Realtime ───────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ── 6. Migration optionnelle des données forum ─────────────
-- (Décommenter pour migrer l'historique)
--
-- Convertir forum_categories → chat_groups
-- INSERT INTO chat_groups (id, community_id, name, is_public, created_at)
-- SELECT id, community_id, name, (visibility = 'public'), created_at
-- FROM forum_categories;
--
-- Convertir forum_posts → chat_messages
-- (chaque post devient un message dans le groupe correspondant)
-- INSERT INTO chat_messages (group_id, community_id, author_id, content, created_at)
-- SELECT
--   ft.category_id,
--   fp.community_id,
--   fp.author_id,
--   CASE WHEN ft.content IS NOT NULL
--     THEN '[' || ft.title || '] ' || fp.content
--     ELSE fp.content
--   END,
--   fp.created_at
-- FROM forum_posts fp
-- JOIN forum_threads ft ON ft.id = fp.thread_id;
--
-- Supprimer les anciennes tables (après vérification)
-- DROP TABLE IF EXISTS forum_posts     CASCADE;
-- DROP TABLE IF EXISTS forum_threads   CASCADE;
-- DROP TABLE IF EXISTS forum_categories CASCADE;
