-- ── Lien événement → tournoi ──────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS linked_tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

-- Index pour les lookups rapides
CREATE INDEX IF NOT EXISTS idx_events_linked_tournament
  ON events(linked_tournament_id)
  WHERE linked_tournament_id IS NOT NULL;

-- ── Enrichissement config tournoi ─────────────────────────────────────────
-- La colonne `config` (jsonb) existe déjà sur tournaments.
-- On documente ici la structure attendue du JSON (pas de migration DDL nécessaire) :
--
-- {
--   "template":          "lol" | "valorant" | "cs2" | "rocket_league" | "smash" | "football" | "fifa" | "custom",
--   "format":            "single_elim" | "double_elim" | "round_robin" | "groups+knockout",
--   "registration":      "solo" | "team",
--   "team_size":         1 | 2 | 3 | 5 | 11,
--   "best_of":           1 | 3 | 5,
--   "max_slots":         8 | 16 | 32 | 64 | null,
--   "third_place_match": true | false,
--   "checkin": { "enabled": true | false, "duration_minutes": 15 },
--   "seeding":           "random" | "manual" | "elo",
--   "prizes":            { "1st": "", "2nd": "", "3rd": "" },
--   "game":              "League of Legends" | "Valorant" | ... | null,
--   "platform":          "PC" | "PS5" | "Xbox" | "Mobile" | null,
--   "region":            "EUW" | "NA" | "BR" | null,
--   "event_id":          "<uuid>" | null   -- référence back vers l'événement parent si créé via événement
-- }

-- ── Commentaires colonnes ─────────────────────────────────────────────────
COMMENT ON COLUMN events.linked_tournament_id IS
  'Tournoi associé à cet événement (créé via l''événement ou lié manuellement)';
