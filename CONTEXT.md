# The Circle — Contexte Projet

> Fichier de contexte à passer en début de chaque nouvelle conversation.
> Dernière mise à jour : 21 Mars 2026 (session 2)

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

## Ce qui est FAIT ✅ (état au 21/03/2026)

### Infrastructure
- [x] Next.js 16 + Supabase + Turbopack configurés
- [x] Auth email/password (login, signup)
- [x] Middleware protection routes `/dashboard` et `/superadmin`
- [x] RLS Supabase en place
- [x] Build propre — 0 erreur TypeScript — 29 routes
- [x] Types Supabase générés (`src/types/database.types.ts` — 1251 lignes)

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
- [x] Saisie stats membres inline (champs dynamiques par membre, sauvegarde optimiste)
- [x] Export CSV membres + stats (bouton "↓ CSV" dans la page membres)
- [x] Enforcement modules par URL : `/c/[slug]/events` et `/c/[slug]/leaderboard` retournent 404 si module désactivé

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
- [x] Emails transactionnels via Resend : candidature reçue (→ owner), décision (→ candidat), bienvenue (→ nouveau membre)
- [x] Token d'invitation UUID (plus prédictible, validé en DB via colonne `invite_token`)

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
- [x] ~~Emails transactionnels~~ ✅ Resend intégré (candidature, décision, bienvenue)
- [ ] Analytics charts dashboard owner (Chart.js — évolution stats membres, activité)
- [ ] Community discovery `/explore` — parcourir les communautés publiques
- [ ] Invitations par email direct (pas juste un lien)

### Priorité 🟡 Valeur ajoutée
- [x] ~~Export CSV membres + stats~~ ✅ Implémenté
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
RESEND_API_KEY                      ← emails transactionnels (resend.com)
STRIPE_SECRET_KEY                   ← serveur uniquement (pas encore utilisé)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

### Notes emails (Resend)
- `FROM` dans `src/lib/email.ts` : `onboarding@resend.dev` en dev (sans domaine vérifié), changer en `noreply@thecircle.app` une fois le domaine acheté et vérifié dans Resend
- Vérifier le domaine dans Resend → Domains en ajoutant des records DNS chez le registrar (gratuit)
- Plan gratuit Resend : 3000 emails/mois

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

---

## Sécurité — Audit 21/03/2026

### 🔴 CRITIQUE

**[SEC-1] ✅ CORRIGÉ — `new Function()` remplacé par `safeEval`**
- Fichier créé : `src/lib/safe-eval.ts` — whitelist chars, blacklist identifiants dangereux, validation formule à la sauvegarde

**[SEC-2] ✅ CORRIGÉ — Token d'invitation UUID**
- Migration `supabase/migrations/20260321_add_invite_token.sql` appliquée
- Colonne `invite_token uuid DEFAULT gen_random_uuid()` sur `communities`

**[SEC-3] ✅ CORRIGÉ — Superadmin vérifié dans le middleware**
- `src/proxy.ts` vérifie `global_role = 'superadmin'` en DB avant d'autoriser l'accès

### 🟠 ÉLEVÉ

**[SEC-4] ✅ CORRIGÉ — Types DB générés**
- Types Supabase générés le 21/03/2026 via `npm run gen:types` (1251 lignes)

**[SEC-5] ⚠️ PARTIEL — Accès modules non vérifié côté navigation**
- `/c/[slug]/events` et `/c/[slug]/leaderboard` ✅ vérifiés (retournent 404 si désactivé)
- Côté dashboard : pas encore de vérification (owner peut toujours accéder même si désactivé — risque faible)

**[SEC-6] CSS injection via `theme_json`**
- Les valeurs de couleurs du thème sont injectées directement dans les styles inline sans validation
- Ex : `color: ${theme.primary}` — si primary = `red; background: url(evil)`, risque d'injection CSS
- **Fix :** Valider que les valeurs de couleur correspondent à un format hex/rgb

### 🟡 MOYEN

**[SEC-7] `console.log('[DEBUG leaderboard]', ...)` en production**
- Fichier : `c/[slug]/leaderboard/page.tsx` ligne ~19
- Expose les erreurs Supabase en console
- **Fix :** Supprimer ou remplacer par `console.error` conditionnel à `NODE_ENV`

**[SEC-8] Pas d'enforcement email verification**
- Le user peut se connecter avant d'avoir confirmé son email
- **Fix :** Ajouter `email_confirm: true` dans la config Supabase ou vérifier `email_confirmed_at`

---

## Bugs identifiés — Audit 21/03/2026

### 🟢 Faciles (quick fix)

**[BUG-1] ✅ CORRIGÉ — Debounce slug check (500ms) dans onboarding et settings**

**[BUG-2] ✅ CORRIGÉ — `console.log` debug leaderboard supprimé**

**[BUG-3] ✅ CORRIGÉ — Police Inter double-chargée supprimée de la landing**

### 🟠 Moyens (logique applicative)

**[BUG-4] Suppression communauté n'orpheline pas les données**
- Fichier : `dashboard/[slug]/settings/SettingsClient.tsx`
- DELETE sur `communities` laisse les `community_members`, `events`, `bets` etc. en DB
- **Fix :** Cascade DELETE en base ou nettoyage applicatif séquentiel

**[BUG-5] Pas de pagination sur le leaderboard**
- Fichier : `c/[slug]/leaderboard/page.tsx`
- Tous les membres chargés d'un coup
- **Fix :** `.range(0, 49)` + bouton "charger plus"

**[BUG-6] ✅ CORRIGÉ — Formule validée via `validateExpression()` à la sauvegarde**

**[BUG-7] Compteur membres non temps-réel dans le dashboard**
- La vue d'ensemble (`dashboard/[slug]/page.tsx`) affiche un count statique SSR
- Si un membre rejoint via `/join`, le dashboard n'est pas rafraîchi
- **Fix :** Subscription Supabase realtime ou revalidation de tag Next.js

### 🔴 Difficiles (architecture)

**[BUG-8] ⚠️ PARTIEL — Enforcement modules**
- `/c/[slug]/events` et `/c/[slug]/leaderboard` ✅ corrigés
- Autres modules vitrine (tournaments, bets, shop, forum) : non encore vérifiés par URL directe

**[BUG-9] Race condition lors de la création de communauté (onboarding)**
- L'onboarding fait plusieurs INSERT séquentiels (community → member → features → stat_schema) sans transaction
- Si l'un échoue à mi-chemin, la communauté est créée en état partiel
- **Fix :** Utiliser une Supabase Edge Function ou une RPC PG transactionnelle

---

## Améliorations potentielles

### Priorité produit
1. ~~**Saisie des stats membres**~~ ✅ Implémenté
2. ~~**Notifications email**~~ ✅ Resend intégré (candidature, décision, bienvenue)
3. **Stripe billing** — Paiement non intégré, plans non enforced côté code
4. **Analytics dashboard** — Charts Chart.js sur l'évolution des stats (inspiration OG)

### UX & Engagement
5. **Community discovery `/explore`** — Parcourir les communautés publiques
6. **Activity feed** — Timeline des actions récentes dans la communauté
7. **Système de streaks** — 🔥 actif / 💤 inactif / 🚀 progression (logique dans OG)
8. **Système saisons** — Diviser les stats en saisons avec historique
9. **Comparaison 1v1** — Panel Versus côte-à-côte (feature forte de l'OG)
10. **Système achievements/trophées** — Badges auto débloqués par milestones
11. **Polls rapides** — Sondages oui/non ou multi-choix
12. **Webhooks Discord/Slack** — Notifs auto quand événement créé, pari ouvert, etc.

### Tech & Infrastructure
13. **`next/image`** — Aucune image n'utilise le composant optimisé (toutes en `<img>`)
14. ~~**Types Supabase**~~ ✅ Générés (`npm run gen:types` — project ID configuré)
15. **Real-time global** — Seul le chat a des subscriptions realtime ; étendre aux stats, événements
16. ~~**Export CSV**~~ ✅ Implémenté (bouton "↓ CSV" dans la page membres)
17. **Domaine custom** — Mentionné en Pro, non implémenté (Vercel Domains API)
18. **Sous-domaines** — `[slug].thecircle.app` pour Starter+ via Vercel wildcard
19. **Tests E2E** — Playwright sur les flows critiques (création communauté, invitation, achat boutique)
20. **Import CSV membres** — Upload en masse pour les grandes communautés

---

## Inspiration OG (dossier /OG — Circled Fight)

Le projet OG est un site gaming clan (Call of Duty) v6.4.0 avec :
- **Dashboard stats** : Chart.js line chart évolution scores semaine par semaine, badges dynamiques (🔥 Streak, 🚀 Progression, 💤 AFK), panel Versus (comparer 2 joueurs)
- **Système paris sophistiqué** : cotes calculées en temps réel via distribution Gaussienne, marge bookmaker 15%, historique des mises, paris combinés
- **Badge system visuel** : matières (Gold, Red, Blue, Purple, Cyan, Pink, Neon), effets (metallic/precious/neon)
- **1v1 Duel Arena** : défi direct, win rate leaderboard, fight cards
- **Style** : très gaming (Orbitron + Rajdhani, dark #050505, accent #FFC107 — palette identique The Circle)
- **Responsive** : hamburger menu mobile, grilles adaptatives
