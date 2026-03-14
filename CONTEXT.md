# The Circle — Contexte Projet

> Fichier de contexte à passer en début de chaque nouvelle conversation.
> Dernière mise à jour : 14 Mars 2026

---

## Vision

**The Circle** est une plateforme SaaS multi-tenant permettant à n'importe quelle communauté (clan gaming, équipe sportive, classe scolaire, association) de créer son espace en ligne personnalisé sans coder.

- **Owner** = créateur/admin d'une communauté
- **Modularité universelle** = l'Owner définit ses propres champs de stats et formule de score
- **Isolation** = chaque communauté est isolée via `community_id` + RLS PostgreSQL
- **Inspiration OG** = le projet vient d'une plateforme gaming originale (dossier /OG) — Circled Fight. Les idées de gamification (badges, points, paris avec cotes, 1v1, streaks) viennent de là.

---

## Stack technique

| Technologie | Rôle |
|---|---|
| Next.js 16 (App Router, Turbopack) | Frontend + SSR |
| Inline CSS (pages publiques/vitrine) | Respect du thème custom par communauté |
| Tailwind CSS (pages dashboard/auth) | Styling interne |
| Supabase (PostgreSQL + Auth + Storage + RLS) | DB, auth, fichiers |
| Stripe | Abonnements (NON intégré) |
| Vercel | Déploiement recommandé |

---

## Schéma DB (tables principales)

| Table | Description |
|---|---|
| `profiles` | Infos user (id, email, display_name, avatar_url, global_role: 'user'/'superadmin') |
| `communities` | Communautés (owner_id, name, slug, community_type, logo_url, banner_url, theme_json, privacy, subscription_tier) |
| `community_members` | Lien user ↔ communauté (role: owner/moderator/member/pending, custom_stats jsonb, points, badges) |
| `stat_schemas` | Champs stats dynamiques (fields jsonb, formula_config jsonb) |
| `features` | Modules actifs par communauté (module enum, enabled bool, visibility: public/members_only) |
| `events` | Événements (title, start_at, end_at, location, is_online, max_attendees, visibility, is_recurring, recurrence_type, recurrence_end_date, recurrence_parent_id) |
| `event_rsvps` | RSVP membres (event_id, profile_id, status: going/maybe/not_going) |
| `applications` | Candidatures (applicant_id, answers_json, status: pending/accepted/rejected) |
| `application_forms` | Formulaires de candidature custom (fields_json) |
| `tournaments` | Tournois (name, type: bracket/round_robin/double_elimination, status, start_date, end_date) |
| `tournament_participants` | Participants (tournament_id, profile_id, score, rank) |
| `bets` | Paris internes (title, options_json, status: open/closed/resolved, close_at) |
| `bet_entries` | Mises (bet_id, profile_id, chosen_option, points_wagered) |
| `shop_items` | Articles boutique (name, price_points, type: badge/cosmetic/physical, stock) |
| `shop_orders` | Commandes boutique (item_id, buyer_id, status: pending/fulfilled) |
| `forum_categories` | Catégories forum (name, is_public) |
| `forum_threads` | Fils de discussion (category_id, author_id, title, content, pinned, locked) |
| `forum_posts` | Messages (thread_id, author_id, content) |

### Migrations à appliquer dans Supabase SQL Editor
```sql
-- Événements récurrents (ajouté le 13/03/2026)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_recurring         boolean       DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_type      text          CHECK (recurrence_type IN ('daily','weekly','biweekly','monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date  timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid          REFERENCES events(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent ON events(recurrence_parent_id);
```

---

## Routing complet (Next.js App Router)

```
/                          → Landing page marketing (Inter font, SaaS pro, universel)
/login  /signup            → Auth Supabase
/onboarding                → Wizard création communauté (5 étapes)
/dashboard                 → Redirect vers la communauté de l'owner
/dashboard/[slug]          → Vue d'ensemble dashboard
/dashboard/[slug]/members  → Gestion membres (stats inline, badges, points)
/dashboard/[slug]/modules  → Activation/config modules (7 modules)
/dashboard/[slug]/stats    → Schéma de stats + formule de score no-code
/dashboard/[slug]/applications → Candidatures reçues (accepter/refuser)
/dashboard/[slug]/events   → Gestion événements (CRUD + récurrents)
/dashboard/[slug]/tournaments → Gestion tournois (brackets, scores, classements)
/dashboard/[slug]/bets     → Gestion paris (créer/fermer/résoudre + redistribution points)
/dashboard/[slug]/forum    → Gestion forum (catégories, threads, modération)
/dashboard/[slug]/shop     → Gestion boutique (articles, commandes)
/dashboard/[slug]/appearance → Thème, logo, bannière, police, dark/light mode
/dashboard/[slug]/settings → Nom, slug, confidentialité, suppression communauté
/c/[slug]                  → Vitrine publique : hero, membres, stats, navigation modules
/c/[slug]/leaderboard      → Classement public calculé par formule
/c/[slug]/events           → Événements publics + RSVP (going/maybe/not_going)
/c/[slug]/tournaments      → Tournois publics (statuts, participants, classements)
/c/[slug]/bets             → Paris publics (miser des points, voir les résultats)
/c/[slug]/forum            → Forum public (catégories publiques + threads)
/c/[slug]/forum/[threadId] → Thread individuel + réponses
/c/[slug]/forum/[threadId]/new → Créer un nouveau thread dans une catégorie
/c/[slug]/shop             → Boutique publique (acheter avec points)
/c/[slug]/apply            → Formulaire de candidature public
/join/[slug]               → Page d'invitation membres
/superadmin                → Panel admin global (lister/modifier plans communities)
```

---

## État des modules

| Clé | Label | Dashboard | Vitrine |
|---|---|---|---|
| `scores` | Stats & Classement | ✅ | ✅ |
| `calendar` | Événements (+ récurrents) | ✅ | ✅ |
| `applications` | Candidatures | ✅ | ✅ |
| `tournaments` | Tournois | ✅ | ✅ |
| `bets` | Paris internes | ✅ | ✅ |
| `shop` | Boutique | ✅ | ✅ |
| `forum` | Forum | ✅ | ✅ |

---

## Ce qui est FAIT ✅ (état au 13/03/2026)

### Infrastructure
- [x] Next.js 16 + Supabase + Turbopack configurés
- [x] Auth email/password (login, signup)
- [x] Middleware protection routes `/dashboard` et `/superadmin`
- [x] RLS Supabase en place
- [x] Build propre — 0 erreur TypeScript — 29 routes

### Onboarding (5 étapes)
- [x] Étape 1 : nom, slug (dispo temps réel), type de communauté (gaming/sport/school/other)
- [x] Étape 2 : description, upload logo (Supabase Storage)
- [x] Étape 3 : stat schema pré-rempli selon type + formule JS no-code
- [x] Étape 4 : sélection modules
- [x] Étape 5 : succès + lien invitation + lien vitrine

### Dashboard Owner
- [x] Sidebar 12 sections avec navigation active
- [x] Vue d'ensemble communauté
- [x] Gestion membres (inline stats, badges, points, rôles, suppression)
- [x] Gestion modules (toggle + visibilité + locks plan)
- [x] Apparence (color picker, logo/bannière upload, police, dark/light, preview live)
- [x] Paramètres (nom, slug, type, confidentialité, suppression)
- [x] Stat schema (champs dynamiques + formule)

### Module Événements
- [x] Dashboard : CRUD complet, groupement par mois
- [x] **Événements récurrents** : daily/weekly/biweekly/monthly, génération auto des occurrences, prévisualisation, suppression en cascade
- [x] Vitrine : RSVP going/maybe/not_going, badge 🔁 sur récurrents

### Module Tournois
- [x] Dashboard : créer/éditer/supprimer tournois, statuts (upcoming/active/completed)
- [x] Gestion participants : ajouter/supprimer par nom, saisie scores, classement auto
- [x] Affichage podium 🥇🥈🥉 pour top 3
- [x] Vitrine : liste tournois par statut, participants et classements inline

### Module Paris
- [x] Dashboard : créer pari (titre + options dynamiques + date clôture)
- [x] Gestion : fermer les mises, résoudre avec option gagnante, redistribution proportionnelle
- [x] Vitrine : progress bars par option, miser des points, voir son entrée, affichage gagnant

### Module Forum
- [x] Dashboard : créer/supprimer catégories, toggle public/privé, pin/lock/supprimer threads
- [x] Vitrine : liste catégories (publiques ou si membre), threads triés (pinned first)
- [x] Thread individuel : posts, réponses (membres), supprimer son post
- [x] Créer thread : formulaire titre + contenu

### Module Boutique
- [x] Dashboard : CRUD articles (nom, desc, prix points, type badge/cosmetic/physical, stock), onglet commandes
- [x] Vitrine : catalogue, achat en points, gestion stock

### Module Candidatures
- [x] Dashboard : liste candidatures avec statut, accepter (crée membre auto) / refuser
- [x] Vitrine `/c/[slug]/apply` : formulaire de candidature

### Pages publiques
- [x] Vitrine `/c/[slug]` : hero avec bannière, membres + stats calculées, nav modules actifs
- [x] Leaderboard : classement par formule custom
- [x] Join page `/join/[slug]`

### Landing page
- [x] Page marketing professionnelle (Inter font, non-gaming, universel)
- [x] Sections : Hero, Use Cases (4 types), Features, How It Works, Pricing, CTA
- [x] Tarifs : Free / Starter 5€ / Pro 15€

### Responsive mobile
- [x] Landing page : media queries `@media (max-width: 900px)` et `640px` — grilles, nav, paddings
- [x] Dashboard sidebar : hamburger menu (☰) avec drawer slide-out, backdrop blur, fermeture auto à la navigation, body scroll lock
- [x] Dashboard layout : `margin-left: 0` + `padding-top: 56px` sur mobile pour accommoder la top bar
- [x] Vitrine `/c/[slug]` : media query `768px` — nav scroll horizontal, grille membres, hero
- [x] Tous les modules dashboard (Events, Bets, Forum, Shop, Tournaments, Applications) : grilles adaptatives `900px` / `640px`
- [x] Onboarding : Tailwind mobile-first (`w-full`, padding, max-width)

### Super Admin
- [x] `/superadmin` : stats globales, liste toutes communautés, changer tier (free/starter/pro) en 1 clic
- [x] Accès conditionné à `profiles.global_role = 'superadmin'`

---

## Ce qui RESTE à faire ❌

### Priorité 🔴 Critique
- [ ] **Stripe billing** — checkout, webhooks, enforcement limites par plan
- [ ] **Enforcement des limites plan** côté code (10 membres Free, 50 Starter, tournois Starter+)

### Priorité 🟠 Important
- [ ] Emails transactionnels (invitation, RSVP, candidature, paiement) via Resend ou Brevo
- [ ] Analytics charts dashboard owner (Chart.js — évolution stats membres, activité)
- [ ] Community discovery `/explore` — parcourir les communautés publiques
- [ ] Invitations par email direct (pas juste un lien)

### Priorité 🟡 Valeur ajoutée
- [ ] Export CSV membres + stats
- [ ] Sous-domaines `[slug].thecircle.app` (Starter+) via Vercel wildcard
- [ ] Système de streaks auto (🔥 actif, 💤 inactif, 🚀 progression)
- [ ] Système saisons (diviser stats en saisons, garder historique)
- [ ] 1v1 / Duel system (défi direct entre membres, win rate)
- [ ] Rich text editor dans forum et événements
- [ ] Annonces épinglées sur la vitrine (owner poste une annonce visible en top)
- [ ] Système achievements/trophées (badges débloqués automatiquement par milestones)
- [ ] Polls rapides (sondages oui/non ou multi-choix dans une communauté)
- [ ] Activity feed (timeline des actions récentes dans une communauté)
- [ ] Webhooks Discord / Slack (notifs auto quand événement créé, pari ouvert, etc.)
- [ ] Comparaison 2 membres côte-à-côte (Versus panel comme dans l'OG)

### Priorité 🟢 Nice to have
- [ ] Super Admin complet (banir communautés, voir revenus, analytics global)
- [ ] Tests E2E (Playwright)
- [ ] Domaine custom (Pro) via Vercel API
- [ ] Import CSV membres

---

## Comment tester le plan Pro (sans Stripe)

1. Aller dans **Supabase Dashboard → SQL Editor** et exécuter :
```sql
UPDATE profiles SET global_role = 'superadmin' WHERE email = 'ton@email.com';
```
2. Aller sur `/superadmin` (connecté avec ce compte)
3. Trouver ta communauté → cliquer **PRO** dans la colonne "Changer de plan"
4. Ta communauté est maintenant `subscription_tier = 'pro'` dans la DB
5. Les vérifications de tier côté code se basent sur ce champ

---

## Conventions code

- **Styles** : inline CSS (avec variables de thème) pour les pages visibles publiquement (respect du thème custom). Tailwind CSS pour les pages dashboard et auth.
- **Pattern pages** : fichier `page.tsx` server component qui fetch les données Supabase, passe en props à un `XClient.tsx` client component.
- **Supabase client** : `@/lib/supabase/client` côté client, `@/lib/supabase/server` côté serveur (avec cookies).
- **Auth** : middleware dans `src/proxy.ts` protège `/dashboard` et `/superadmin`.
- **Polices landing** : Inter (pro, universel). **Polices dashboard/vitrine** : Orbitron (titres/branding), Rajdhani (corps).
- **Palette dashboard** : bg `#0a0a0a`, panels `#141414`, borders `#2a2a2a`, accent `#FFC107`, danger `#FF2344`, success `#4CAF50`.
- **Palette landing** : bg `#09090b`, panels `#111113`, borders `#1c1c1f`, accent `#FFC107`.

---

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY           ← serveur uniquement
STRIPE_SECRET_KEY                   ← serveur uniquement (pas encore utilisé)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

---

## Abonnements (Stripe — pas encore intégré)

| Feature | Free | Starter (5€/mois) | Pro (15€/mois) |
|---|---|---|---|
| Membres max | 10 | 50 | Illimité |
| URL | /c/slug | slug.thecircle.app | domaine custom |
| Tournois | ❌ | ✅ | ✅ |
| Paris | ❌ | ✅ | ✅ |
| Forum | ✅ | ✅ | ✅ |
| Boutique virtuelle | ✅ | ✅ | ✅ |
| Boutique physique | ❌ | ❌ | ✅ |
| Export CSV | ❌ | ❌ | ✅ |
| Branding supprimé | ❌ | ❌ | ✅ |

---

## Inspiration OG (dossier /OG — Circled Fight)

Le projet OG est un site gaming clan (Call of Duty) v6.4.0 avec :
- **Dashboard stats** : Chart.js line chart évolution scores semaine par semaine, badges dynamiques (🔥 Streak, 🚀 Progression, 💤 AFK), panel Versus (comparer 2 joueurs)
- **Système paris sophistiqué** : cotes calculées en temps réel via distribution Gaussienne, marge bookmaker 15%, historique des mises, paris combinés
- **Badge system visuel** : matières (Gold, Red, Blue, Purple, Cyan, Pink, Neon), effets (metallic/precious/neon)
- **1v1 Duel Arena** : défi direct, win rate leaderboard, fight cards
- **Style** : très gaming (Orbitron + Rajdhani, dark #050505, accent #FFC107 — palette identique The Circle)
- **Responsive** : hamburger menu mobile, grilles adaptatives
