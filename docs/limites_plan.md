# Limites par Plan — The Circle

> Document de conception pour l'enforcement des limites sans Stripe.
> Rédigé le 14 Mars 2026.

---

## Pourquoi sans Stripe ?

Le champ `subscription_tier` (`free` / `starter` / `pro`) existe déjà dans la table `communities`.
Le superadmin peut déjà le modifier via `/superadmin`.
L'enforcement est donc **100% côté code** : lire ce champ et bloquer ou afficher des gates.
Stripe ne servira qu'à changer ce champ automatiquement après paiement — le reste ne change pas.

---

## Proposition de limites (révisée)

> **Pourquoi 10 membres Free est trop peu ?**
> Un clan gaming = 15-25 joueurs. Une équipe sport = 15-30 joueurs. Une classe = ~30 élèves.
> À 10 membres, un owner ne peut même pas tester avec sa vraie communauté, donc il ne convertit jamais.
> La règle SaaS classique : le Free doit être *utilisable*, juste *limité*.

| Feature | Free | Starter (5€/mois) | Pro (15€/mois) |
|---|---|---|---|
| **Membres max** | **30** | **150** | Illimité |
| **URL** | `/c/slug` | `slug.thecircle.app` | Domaine custom |
| **Stats & Classement** | ✅ | ✅ | ✅ |
| **Événements** | ✅ (5 max actifs) | ✅ Illimité | ✅ Illimité |
| **Candidatures** | ✅ | ✅ | ✅ |
| **Forum** | ✅ (3 catégories max) | ✅ Illimité | ✅ Illimité |
| **Boutique virtuelle** | ✅ (10 articles max) | ✅ Illimité | ✅ Illimité |
| **Tournois** | ❌ | ✅ | ✅ |
| **Paris internes** | ❌ | ✅ | ✅ |
| **Boutique physique** | ❌ | ❌ | ✅ |
| **Export CSV** | ❌ | ❌ | ✅ |
| **Branding supprimé** | ❌ | ❌ | ✅ |
| **Analytics charts** | ❌ | ✅ | ✅ |

### Raisonnement par limite

- **30 membres Free** : couvre une classe entière, une équipe sport, un petit clan. L'owner peut vraiment tester. Conversion naturelle quand la communauté grandit.
- **150 membres Starter** : couvre la grande majorité des communautés "sérieuses" à 5€/mois. Le passage à Pro est pour les structures qui ont vraiment besoin d'un domaine custom ou d'une boutique physique.
- **Événements 5 max (Free)** : pas bloquant pour débuter, mais force à gérer ou passer Starter.
- **Forum 3 catégories (Free)** : suffisant pour #général, #annonces, #off-topic.
- **Boutique 10 articles (Free)** : suffisant pour des badges, force le passage Starter pour un vrai shop.
- **Tournois/Paris = Starter+** : ce sont les features de gamification avancée — vraie motivation de conversion.

---

## Architecture d'enforcement

### 1. Fichier central des limites

Créer `src/lib/plan-limits.ts` :

```ts
export type Tier = 'free' | 'starter' | 'pro'

export const PLAN_LIMITS = {
  free: {
    members: 30,
    active_events: 5,
    forum_categories: 3,
    shop_items: 10,
    tournaments: false,
    bets: false,
    physical_shop: false,
    export_csv: false,
    analytics: false,
    custom_subdomain: false,
    custom_domain: false,
  },
  starter: {
    members: 150,
    active_events: Infinity,
    forum_categories: Infinity,
    shop_items: Infinity,
    tournaments: true,
    bets: true,
    physical_shop: false,
    export_csv: false,
    analytics: true,
    custom_subdomain: true,
    custom_domain: false,
  },
  pro: {
    members: Infinity,
    active_events: Infinity,
    forum_categories: Infinity,
    shop_items: Infinity,
    tournaments: true,
    bets: true,
    physical_shop: true,
    export_csv: true,
    analytics: true,
    custom_subdomain: true,
    custom_domain: true,
  },
} as const

export function canDo(tier: Tier, feature: keyof typeof PLAN_LIMITS.free): boolean {
  const limit = PLAN_LIMITS[tier][feature]
  return limit === true || limit === Infinity
}

export function getLimit(tier: Tier, feature: 'members' | 'active_events' | 'forum_categories' | 'shop_items'): number {
  return PLAN_LIMITS[tier][feature] as number
}
```

### 2. Points d'enforcement

Chaque check se fait en **deux couches** : UI (soft gate) + serveur (hard block).

#### A. Limite membres

**Où bloquer :** dans `ApplicationsClient.tsx` (accepter une candidature) et `MembersClient.tsx` (ajouter manuellement).

```ts
// Côté serveur dans l'action "accept application"
const { count } = await supabase
  .from('community_members')
  .select('*', { count: 'exact', head: true })
  .eq('community_id', community.id)
  .eq('status', 'active') // si tu as ce champ

const limit = getLimit(community.subscription_tier, 'members')
if (count >= limit) {
  return { error: `Limite de ${limit} membres atteinte. Passez au plan supérieur.` }
}
```

#### B. Modules bloqués (Tournois, Paris, Boutique physique)

**Où bloquer :** dans `ModulesClient.tsx` — le toggle est déjà "locké" visuellement, ajouter le check côté serveur dans l'action d'activation.

```ts
// Dans l'action toggle module
if (module === 'tournaments' && !canDo(tier, 'tournaments')) {
  return { error: 'Les tournois nécessitent le plan Starter ou supérieur.' }
}
```

**Aussi bloquer** dans les pages des modules eux-mêmes (`/dashboard/[slug]/tournaments/page.tsx`) :

```ts
// Dans le server component page.tsx
if (!canDo(community.subscription_tier, 'tournaments')) {
  return <UpgradeGate feature="Tournois" requiredPlan="Starter" />
}
```

#### C. Limites souples (événements actifs, catégories forum, articles shop)

**Où bloquer :** dans les formulaires de création, côté serveur.

```ts
// Exemple dans EventsClient — action "créer événement"
const { count } = await supabase
  .from('events')
  .select('*', { count: 'exact', head: true })
  .eq('community_id', community.id)
  .gte('end_at', new Date().toISOString()) // événements encore actifs

const limit = getLimit(community.subscription_tier, 'active_events')
if (count >= limit) {
  return { error: `Limite de ${limit} événements actifs. Archivez-en ou passez au plan Starter.` }
}
```

### 3. Composant UpgradeGate

Créer `src/components/UpgradeGate.tsx` — réutilisé partout où un module est bloqué :

```tsx
// Affiche un panneau "Feature locked" avec un bouton Upgrade
// Props: feature (string), requiredPlan ('Starter' | 'Pro'), currentTier
```

Affiché dans :
- Les pages dashboard des modules bloqués
- Les toggles dans `/dashboard/[slug]/modules`
- Les boutons de création quand limite atteinte

### 4. Ordre d'implémentation recommandé

1. **`src/lib/plan-limits.ts`** — le fichier central (5 min)
2. **`UpgradeGate.tsx`** — composant UI réutilisable (20 min)
3. **Limite membres** dans ApplicationsClient + MembersClient (30 min)
4. **Module gates** dans ModulesClient + pages Tournaments/Bets (30 min)
5. **Limites souples** Events / Forum / Shop au moment de la création (45 min)

---

## Ce qui NE change pas sans Stripe

- Le superadmin peut toujours upgrader manuellement via `/superadmin`
- Pour tester le Pro : SQL `UPDATE communities SET subscription_tier = 'pro' WHERE slug = 'mon-slug'`
- Quand Stripe arrivera : le webhook `checkout.session.completed` fera juste ce `UPDATE` automatiquement

---

## Impact sur le CONTEXT.md

Une fois fait, marquer dans "Ce qui RESTE à faire" :
- [x] **Enforcement des limites plan** côté code
- Laisser **Stripe billing** séparé (toujours ❌)
