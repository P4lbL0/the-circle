-- Migration : Événements récurrents
-- À exécuter dans : Supabase Dashboard → SQL Editor

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_recurring         boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_type      text          CHECK (recurrence_type IN ('daily','weekly','biweekly','monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date  timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid          REFERENCES events(id) ON DELETE CASCADE;

-- Index pour retrouver facilement les occurrences d'un event parent
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent ON events(recurrence_parent_id);
