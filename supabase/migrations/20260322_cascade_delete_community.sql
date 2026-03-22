-- Migration : CASCADE DELETE sur toutes les tables liées à communities
-- Quand une communauté est supprimée, toutes ses données sont supprimées en cascade
-- Sécurité SEC-9 — 22/03/2026

-- community_members
ALTER TABLE community_members
  DROP CONSTRAINT IF EXISTS community_members_community_id_fkey,
  ADD CONSTRAINT community_members_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- stat_schemas
ALTER TABLE stat_schemas
  DROP CONSTRAINT IF EXISTS stat_schemas_community_id_fkey,
  ADD CONSTRAINT stat_schemas_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- features
ALTER TABLE features
  DROP CONSTRAINT IF EXISTS features_community_id_fkey,
  ADD CONSTRAINT features_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- events
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_community_id_fkey,
  ADD CONSTRAINT events_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- event_rsvps
ALTER TABLE event_rsvps
  DROP CONSTRAINT IF EXISTS event_rsvps_event_id_fkey,
  ADD CONSTRAINT event_rsvps_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- applications
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_community_id_fkey,
  ADD CONSTRAINT applications_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- application_forms
ALTER TABLE application_forms
  DROP CONSTRAINT IF EXISTS application_forms_community_id_fkey,
  ADD CONSTRAINT application_forms_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- tournaments
ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_community_id_fkey,
  ADD CONSTRAINT tournaments_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- tournament_participants
ALTER TABLE tournament_participants
  DROP CONSTRAINT IF EXISTS tournament_participants_tournament_id_fkey,
  ADD CONSTRAINT tournament_participants_tournament_id_fkey
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- bets
ALTER TABLE bets
  DROP CONSTRAINT IF EXISTS bets_community_id_fkey,
  ADD CONSTRAINT bets_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- bet_entries
ALTER TABLE bet_entries
  DROP CONSTRAINT IF EXISTS bet_entries_bet_id_fkey,
  ADD CONSTRAINT bet_entries_bet_id_fkey
    FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE;

-- shop_items
ALTER TABLE shop_items
  DROP CONSTRAINT IF EXISTS shop_items_community_id_fkey,
  ADD CONSTRAINT shop_items_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- shop_orders
ALTER TABLE shop_orders
  DROP CONSTRAINT IF EXISTS shop_orders_item_id_fkey,
  ADD CONSTRAINT shop_orders_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE;

-- forum_categories
ALTER TABLE forum_categories
  DROP CONSTRAINT IF EXISTS forum_categories_community_id_fkey,
  ADD CONSTRAINT forum_categories_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- forum_threads
ALTER TABLE forum_threads
  DROP CONSTRAINT IF EXISTS forum_threads_category_id_fkey,
  ADD CONSTRAINT forum_threads_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE;

-- forum_posts
ALTER TABLE forum_posts
  DROP CONSTRAINT IF EXISTS forum_posts_thread_id_fkey,
  ADD CONSTRAINT forum_posts_thread_id_fkey
    FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE;

-- announcements (si existe)
ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_community_id_fkey,
  ADD CONSTRAINT announcements_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
