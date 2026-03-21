# Fonctionnalités — The Circle

Dernière mise à jour : 21/03/2026 (session 2)

---

## ✅ Fonctionnalités opérationnelles

### Auth & Comptes
| Fonctionnalité | Comment ça marche |
|---|---|
| **Connexion email/password** | Supabase Auth, sessions JWT, cookies SSR via `@supabase/ssr` |
| **Magic link** | Envoi via Supabase Auth, lien à usage unique par email |
| **OAuth (Google/GitHub)** | Callback `/auth/callback` redirige après consentement OAuth |
| **Inscription** | Crée un profil dans `profiles` lié à l'utilisateur Supabase Auth |

### Communauté & Onboarding
| Fonctionnalité | Comment ça marche |
|---|---|
| **Création de communauté** | Onboarding 5 étapes : slug → logo → stats → modules → confirmation. Stocké dans `communities` |
| **Slug unique** | Vérifié en temps réel côté client avant validation |
| **Upload logo/bannière** | Supabase Storage, URL publique stockée dans `communities.logo_url / banner_url` |
| **Thème custom** | JSON `theme_json` : primaryColor, accentColor, font, darkMode. 6 presets + palette 12 couleurs |
| **Modules (activation)** | Table `features` : chaque module a `enabled` + `visibility (public/members)` |
| **Lien d'invitation** | Token UUID cryptographique dans `communities.invite_token`, URL `/join/[slug]?token=…` |

### Dashboard Owner
| Fonctionnalité | Comment ça marche |
|---|---|
| **Gestion des membres** | Liste avec filtre rôle/recherche, panel édition latéral, grid adaptatif |
| **Changement de rôle** | Update direct Supabase `community_members.role` |
| **Attribution de points** | Champ numérique ±10, update `community_members.points` |
| **Export CSV membres** | Génération côté client avec `Blob + URL.createObjectURL`, inclut stats custom |
| **Saisie stats custom** | Inputs dans le panel édition membre, stockés dans `custom_stats` (JSON) |
| **Apparence** | Page dédiée pour thème, logo, bannière avec prévisualisation instantanée |
| **Schéma de stats** | Définition des champs (label, type, visibilité) + formule de scoring via `stat_schemas` |

### Système de Badges (Forge)
| Fonctionnalité | Comment ça marche |
|---|---|
| **Forger un badge** | Interface dans le panel membre : nom, couleur (25 thèmes ou HEX libre), effet, frame, description |
| **25 couleurs thématiques** | Or Royal, Diamant, Galaxie, Magma, Obsidienne, Glace, Horror, etc. Rendues via classes CSS `tc-badge-{id}` |
| **13 effets d'animation** | Holo, Brillant, Pulsation, Électrique, Glitch, Brûlant, Radioactif, Foudre, Arc-en-ciel, Matrix, Néon, Flammes, Cristal de glace — classes `tc-effect-{id}` |
| **10 frames de bordure** | Elite, Cyber, Danger, Spectral, Sang, Mythique, Chrome, Ailes, Cirque, Vide — classes `tc-frame-{id}` |
| **Aperçu live** | Le badge se met à jour en temps réel dans la Forge avant attribution |
| **Compatibilité rétroactive** | Anciens badges HEX (#RRGGBB) fonctionnent via style inline, nouveaux via classes CSS |
| **Stockage** | JSON dans `community_members.badges` : `{ name, color, effect, frame, desc, awarded_at }` |
| **Ajouter un effet sans code** | Ajouter une entrée dans `BADGE_EFFECTS[]` dans `src/lib/badgeConfig.ts` — aucune autre modif requise |
| **Affichage public** | `BadgeRenderer.tsx` injecte le CSS une seule fois (singleton), rendu SSR via `<BadgeStyles />` |

### Dossier Soldat (Profil)
| Fonctionnalité | Comment ça marche |
|---|---|
| **Page dossier** | Route `/c/[slug]/membre/[memberId]` — server component qui fetch les données |
| **Header identité** | Avatar, nom, rôle traduit (Commandant/Officier/Opérateur/Recrue), tous les badges avec effets |
| **Filigrane "Dossier Soldat"** | Texte en arrière-plan avec opacité 4%, couleur primaire de la communauté |
| **Stats clés** | 3 métriques en haut : Points, Score calculé, Nombre de badges |
| **Tab Statistiques** | Score en highlight + grid de toutes les stats custom du membre |
| **Tab Identité** | Pseudo, rôle, date d'arrivée, points. Email visible uniquement pour le membre lui-même |
| **Accès depuis MemberCard** | Lien `▸ dossier` sous le rôle sur chaque carte de la vitrine |

### Vitrine Publique
| Fonctionnalité | Comment ça marche |
|---|---|
| **Page communauté** | `/c/[slug]` — server component, rendu inline CSS selon `theme_json` |
| **Podium top 3** | Affiché si ≥3 membres et module `scores` actif |
| **MemberCards** | Grille responsive, badges avec effets, lien dossier, hover animation |
| **Navigation modules** | Tabs dynamiques selon modules actifs/visibilité (public vs membres) |
| **Leaderboard** | `/c/[slug]/leaderboard` — classement avec score calculé par formule |

### Modules Communautaires
| Fonctionnalité | Comment ça marche |
|---|---|
| **Lien Événement ↔ Tournoi** | À la création d'un événement : créer un nouveau tournoi (avec template) ou lier un tournoi existant. Si récurrent, génère 1 tournoi par occurrence. Chaque tournoi reste modifiable indépendamment. |
| **Chat temps réel** | Supabase Realtime, groupes de discussion, messages persistés |
| **Forum** | Topics/threads, table `forum_threads` + `forum_posts` |
| **Événements** | Récurrents (hebdo/mensuel), table `events` avec `recurrence_json`, lien optionnel vers un tournoi (`linked_tournament_id`) |
| **Tournois** | Statuts draft/open/ongoing/completed/cancelled, table `tournaments`, système de templates (LoL, Valorant, CS2, Rocket League, Smash, Football, FIFA, Custom), config JSON riche (format, team_size, best_of, checkin, seeding, prizes, game, platform, region) |
| **Boutique** | Items badge/cosmétique/physique, commandes, gestion stock, table `shop_items` + `shop_orders` |
| **Candidatures** | Formulaires de candidature, table `applications` |

### Infra & Sécurité
| Fonctionnalité | Comment ça marche |
|---|---|
| **RLS Supabase** | Row Level Security sur toutes les tables sensibles |
| **Formules de score sécurisées** | `safe-eval.ts` — évalue uniquement les opérations arithmétiques, bloque localStorage/eval/fetch/window |
| **Superadmin** | Page `/superadmin` pour changer les tiers (free/starter/pro) manuellement |
| **Plans & limites** | Définitions dans `plan-limits.ts`, partiellement enforced |
| **Emails transactionnels** | Intégration Resend via `/api/email`, templates à finaliser |
| **Responsive mobile** | Hamburger drawer sur toutes les pages dashboard et vitrine |

---

## ⚠️ Partiellement implémenté

| Fonctionnalité | État |
|---|---|
| Enforcement des limites plan | Définitions existent, vérifications non systématiques |
| Emails transactionnels | Resend intégré, manque templates |
| Analytics / Charts | Schema OK, pas de visualisation Chart.js |

## ❌ Non implémenté

| Fonctionnalité | Priorité |
|---|---|
| **Stripe billing** | Critique |
| Page profil global (hors communauté) | Moyenne |
| Fix token invitation UUID (actuellement = slug) | Haute |
| Fix `new Function()` dans formules (remplacé par safe-eval) | ✅ Fait |
