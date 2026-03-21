# Future Ideas — The Circle
_Fichier de réflexion. Aucun code modifié ici, uniquement des plans et analyses._

---

## 1. Application Mobile

### Faisabilité : ✅ Très faisable — 3 options selon l'ambition

---

### Option A — PWA (Progressive Web App) ⚡ Recommandée pour commencer

**C'est quoi ?**
Transformer le site Next.js actuel en une app installable sur iPhone et Android directement depuis le navigateur, sans passer par l'App Store.

**Ce que ça donne à l'utilisateur :**
- Icône sur l'écran d'accueil, comme une vraie app
- Fonctionne hors-ligne (pages mises en cache)
- Plein écran sans barre du navigateur
- Notifications push (Android natif, iOS 16.4+)

**Ce qu'il faut changer dans le code :**
- Installer `next-pwa` (1 package)
- Créer un `manifest.json` (nom, icônes, couleur thème)
- Configurer le service worker dans `next.config.js`
- Ajouter des icônes PNG en plusieurs tailles (192x192, 512x512)
- Optionnel : bannière "Installer l'app" (`beforeinstallprompt`)

**Complexité :** Faible — 1 à 2 jours de travail
**Nouveau projet :** Non, tout dans le projet actuel
**App Store :** Non (avantage : pas de frais Apple/Google, pas de validation)

**Limite principale :** Moins "natif" qu'une vraie app. Accès caméra limité sur iOS.

---

### Option B — React Native / Expo 📱 Pour une vraie app store

**C'est quoi ?**
Un deuxième projet en React Native (Expo) qui consomme exactement la même base Supabase. Le code UI est réécrit pour mobile natif, mais toute la logique (auth, DB, RLS) reste identique.

**Ce qu'on réutilise du projet actuel :**
- Toute la base de données Supabase (aucun changement)
- Les types TypeScript (`database.types.ts`)
- Le client Supabase (`@supabase/supabase-js` fonctionne dans React Native)
- La logique métier (pas le CSS évidemment)

**Ce qu'il faut créer from scratch :**
- Nouveau repo Expo / React Native
- Navigation (React Navigation ou Expo Router)
- Tous les écrans UI (pas de Tailwind, on utilise StyleSheet natif ou NativeWind)
- Notifications push via Expo Notifications + Supabase Edge Functions

**Complexité :** Élevée — 4 à 8 semaines selon les features
**Nouveau projet :** Oui, un deuxième repo
**App Store :** Oui (Apple Store + Google Play, frais 99$/an Apple, 25$ Google one-time)

**Avantage majeur :** Accès caméra natif, notifications push fiables, performances fluides, barre de navigation iOS/Android respectée.

---

### Option C — Capacitor (wrapper de l'app web) 🔄 Compromis

**C'est quoi ?**
Emballer l'app Next.js existante dans une coquille native iOS/Android via Capacitor. L'UI reste du HTML/CSS mais tourne dans une WebView native.

**Complexité :** Moyenne — 1 à 2 semaines
**Nouveau projet :** Non, s'intègre dans le projet actuel
**App Store :** Oui (même démarche que React Native)

**Problème principal :** Next.js est pensé pour le serveur. Capacitor fonctionne mieux avec des apps full-client (Vite, CRA). Il faudrait exporter l'app en mode statique, ce qui casse les Server Components et les API Routes — donc **incompatible avec l'architecture actuelle** sans gros refactoring.

---

### 📋 Recommandation

```
Court terme   → Option A (PWA)      : 2 jours, déjà une belle expérience mobile
Long terme    → Option B (Expo)     : projet séparé, vraie app store, notifications
```

La PWA peut être lancée immédiatement et donne déjà 80% de l'expérience mobile. Expo est la vraie option pro si on veut être sur l'App Store.

---

## 2. Système de Cartes Collectionables (TCG Custom)

### Faisabilité : ✅ Très faisable — Feature riche mais bien découpable

---

### Concept général

Chaque communauté peut créer ses propres cartes collectionables entièrement personnalisées : photo custom, nom, rareté, PV, attaques, lore. Les membres ouvrent des packs pour les obtenir et les collectionnent. Intégration possible avec les points et la boutique existante.

---

### Architecture des données (nouvelles tables SQL)

```sql
-- Cartes définies par l'admin de la communauté
cards (
  id, community_id, name, description,
  image_url,          -- photo uploadée sur Supabase Storage
  rarity,             -- 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra'
  drop_weight,        -- poids relatif (ex: common=100, ultra=1) — pas un % mais un poids
  hp,                 -- points de vie (ex: 120)
  attacks,            -- JSON : [{ name, damage, description, cost }]
  type,               -- ex: 'feu' | 'eau' | 'ombre' | libre (défini par la commu)
  is_active,          -- true = peut tomber dans les packs
  created_at
)

-- Packs définis par l'admin
card_packs (
  id, community_id, name, description,
  cover_image_url,
  cost_points,        -- prix en points (intégration avec le système de points)
  cards_per_pack,     -- nombre de cartes par pack (ex: 5)
  guaranteed_rarity,  -- rareté minimale garantie (ex: 'rare' = au moins 1 rare par pack)
  is_active,
  created_at
)

-- Collection d'un membre (ses cartes obtenues)
player_cards (
  id, community_id, profile_id, card_id,
  quantity,           -- peut avoir plusieurs exemplaires de la même carte
  obtained_at
)

-- Historique des packs ouverts
pack_openings (
  id, community_id, profile_id, pack_id,
  cards_obtained,     -- JSON : [card_id, card_id, ...]
  opened_at
)
```

---

### Système de rareté et drop rates

Le drop n'utilise pas des pourcentages directs mais des **poids relatifs** — plus robuste et flexible :

```
Exemple de configuration :
  Commune      → poids 1000  → ~73.5%
  Peu Commune  → poids 250   → ~18.4%
  Rare         → poids 100   → ~7.4%
  Épique       → poids 10    → ~0.7%
  Légendaire   → poids 2     → ~0.15%
  Ultra        → poids 1     → ~0.07%

Total des poids = 1363
Probabilité d'une carte = son_poids / total_poids
```

Chaque carte a son propre `drop_weight`. L'admin peut créer 3 cartes Légendaires différentes avec poids=2 chacune → chaque légendaire a 0.07% de chance mais le total légendaire = 0.15%.

**Garantie de rareté par slot :**
Un pack de 5 cartes peut définir que :
- Slots 1-3 : tirage libre (tous raretés possibles)
- Slot 4 : minimum Rare (filtre les cartes en-dessous)
- Slot 5 : minimum Rare (garantie que le pack vaut le coup)

---

### Logique d'ouverture de pack (côté serveur)

⚠️ **Le tirage DOIT être fait côté serveur** (Supabase Edge Function ou API Route Next.js) pour être infalsifiable. Si c'est fait côté client, un utilisateur peut manipuler le résultat.

```
Flux d'ouverture :
1. Client appelle POST /api/open-pack { packId, communityId }
2. Serveur vérifie que le membre a assez de points
3. Serveur déduit les points
4. Serveur tire N cartes avec l'algorithme de poids
5. Serveur insère dans player_cards + pack_openings
6. Serveur retourne les cartes obtenues
7. Client joue l'animation de révélation avec les cartes reçues
```

---

### Animations d'ouverture de pack 🎬

C'est la partie la plus fun et la plus complexe visuellement. Voici comment faire ça proprement :

**Stack recommandée : CSS pur + Framer Motion**
- Framer Motion est déjà compatible avec Next.js, animations déclaratives
- Ou CSS keyframes pour les effets de brillance/particules

**Séquence d'animation d'ouverture :**

```
Phase 1 — Présentation du pack (0.5s)
  Le pack animé flotte légèrement avec un halo lumineux
  Bouton "Ouvrir" qui pulse

Phase 2 — Ouverture (0.8s)
  Le pack se déchire / explose avec des particules
  Transition vers les cartes dos retourné

Phase 3 — Révélation des cartes (1.5s par carte ou toutes en même temps)
  Option A : cartes en ligne, flip une par une au clic
  Option B : reveal automatique avec délai entre chaque (plus épique)

Phase 4 — Mise en valeur des rares (si Epic/Légendaire/Ultra)
  La carte s'agrandit au centre
  Effet holographique CSS (gradient animé en rotation)
  Particules dorées / étoiles / lueur
  Son optionnel (pas implémenté mais possible avec Web Audio API)
  Fond qui change de couleur selon la rareté
```

**Effets visuels par rareté :**
```
Commune      → Fond gris, pas d'effet spécial
Peu Commune  → Léger shimmer argenté
Rare         → Shimmer bleu + légère lueur
Épique       → Rotation holographique violette + particules
Légendaire   → Fond doré + particules + screen shake doux
Ultra        → Full screen flash + animation de 3-4s + effet cinématique
```

Ces effets sont réalisables entièrement en CSS avec `@keyframes` + `linear-gradient` animés + `box-shadow` dynamique. Le système de badges actuel (effets holo, brillant, électrique, etc.) est exactement la même technologie — on peut réutiliser et étendre `badgeConfig.ts`.

---

### Intégrations avec l'existant

| Feature existante | Intégration cartes |
|---|---|
| **Points membres** | Acheter des packs avec ses points |
| **Boutique** | Vendre des packs en boutique (achat avec points) |
| **Tournois** | Cartes gagnées en récompense de tournoi |
| **Badges** | Carte exclusive = badge rare attribué auto |
| **Dossier Soldat** | Afficher les cartes les plus rares dans le profil |
| **Annonces** | L'admin annonce une nouvelle carte légendaire disponible |

---

### Découpage en phases de développement

**Phase 1 — Fondations (1-2 semaines)**
- Tables SQL (cards, card_packs, player_cards, pack_openings)
- UI admin : créer/modifier/supprimer des cartes (upload photo, configurer stats)
- UI admin : créer des packs (sélectionner cartes incluses, prix en points)

**Phase 2 — Collection membre (1 semaine)**
- Page "Ma Collection" par communauté
- Affichage des cartes (grille, filtres par rareté)
- Compteur d'exemplaires

**Phase 3 — Ouverture de packs (1-2 semaines)**
- API Route sécurisée pour le tirage côté serveur
- UI d'ouverture basique (révélation des cartes)
- Déduction des points automatique

**Phase 4 — Animations épiques (1-2 semaines)**
- Animations CSS/Framer Motion pour chaque rareté
- Effet holographique Ultra/Légendaire
- Page d'accueil communauté : showcase des cartes rares

**Phase 5 — Features avancées (optionnel)**
- Échange de cartes entre membres
- Marché aux cartes (vente avec points)
- Classement des collectionneurs
- Cartes d'événements limitées (disponibles seulement pendant un tournoi)
- Crafting : fusionner des doublons pour obtenir une carte supérieure

---

### Complexité globale

| Aspect | Niveau |
|---|---|
| Base de données | Moyen (4-5 tables, RLS à écrire) |
| UI admin création cartes | Moyen (formulaire + upload image) |
| Algorithme de tirage | Facile (algorithme de poids standard) |
| Sécurité (serveur-side RNG) | Moyen (API Route ou Edge Function) |
| Animation ouverture basique | Moyen (CSS flip + révélation) |
| Animation Ultra/Légendaire épique | Difficile mais fun |
| Intégration boutique/points | Facile (déjà fait pour la boutique) |

**Estimation totale : 6 à 10 semaines** pour un système complet et poli.
Le système peut être lancé dès la Phase 3 (fonctionnel mais animations simples) et enrichi ensuite.

---

## Autres idées à explorer plus tard

- **Classements saisonniers** : reset des points tous les X jours, hall of fame
- **Système de quêtes** : "Gagne 3 tournois ce mois" → récompense points/carte
- **Replay de matchs** : enregistrer et rejouer les résultats de tournoi
- **Streaming intégré** : widget Twitch/YouTube Live dans la vitrine
- **Sous-domaine custom** : `maguilde.thecircle.app` (déjà prévu en Pro)
- **API publique** : permettre aux admins d'intégrer des données via webhook
