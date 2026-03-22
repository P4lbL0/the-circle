# Audit Sécurité — The Circle

> Dernière mise à jour : 22/03/2026

---

## Résumé des risques

| Niveau | Nombre | État |
|---|---|---|
| 🔴 Critique | 3 | 3 corrigés ✅ |
| 🟠 Élevé | 4 | 4 corrigés ✅ |
| 🟡 Moyen | 3 | 3 corrigés ✅ |

**Tous les points de sécurité identifiés sont corrigés.**

---

## 🔴 CRITIQUE

### [SEC-1] ✅ CORRIGÉ — Injection via `new Function()` dans les formules de score
- **Fichier :** `src/lib/safe-eval.ts`
- **Fix :** Whitelist de caractères autorisés, blacklist identifiants dangereux (`eval`, `fetch`, `window`, `localStorage`, `process`). Validation à la sauvegarde.

### [SEC-2] ✅ CORRIGÉ — Token d'invitation prédictible (= slug communauté)
- **Fichier :** `supabase/migrations/20260321_add_invite_token.sql`
- **Fix :** Colonne `invite_token uuid DEFAULT gen_random_uuid()` sur `communities`. Token UUID validé en DB.

### [SEC-3] ✅ CORRIGÉ — Accès superadmin sans vérification en DB
- **Fichier :** `src/proxy.ts`
- **Fix :** Middleware vérifie `profiles.global_role = 'superadmin'` en base avant d'autoriser l'accès.

---

## 🟠 ÉLEVÉ

### [SEC-4] ✅ CORRIGÉ — Absence de types DB
- **Fichier :** `src/types/database.types.ts` (1251 lignes générées le 21/03/2026)
- **Fix :** Types Supabase générés via `npm run gen:types`.

### [SEC-5] ✅ CORRIGÉ — Enforcement modules non vérifié sur toutes les routes
- **Fix :** Toutes les pages vitrine vérifient le feature en DB avant de rendre le contenu :
  - `/c/[slug]/events` ✅ `/c/[slug]/leaderboard` ✅
  - `/c/[slug]/tournaments` ✅ `/c/[slug]/bets` ✅
  - `/c/[slug]/shop` ✅ `/c/[slug]/chat` ✅ (forum)

### [SEC-6] ✅ CORRIGÉ — Injection CSS via `theme_json`
- **Fichier :** `src/app/(dashboard)/dashboard/[slug]/appearance/page.tsx`
- **Fix :** Validation dans `handleSave` avant la sauvegarde :
```ts
const isValidColor = (v: string) =>
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v) ||
  /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(v)
```

### [SEC-7] ✅ CORRIGÉ — `console.log('[DEBUG leaderboard]', ...)` en production
- **Fix :** Supprimé lors de l'audit du 21/03/2026.

---

## 🟡 MOYEN

### [SEC-8] ✅ CORRIGÉ — Pas d'enforcement email verification
- **Fichiers :** `src/proxy.ts` + `src/app/(auth)/login/page.tsx`
- **Fix :** Le middleware bloque l'accès au dashboard si `email_confirmed_at` est null et redirige vers `/login?error=email_not_confirmed`. La page login affiche le message explicite.

### [SEC-9] ✅ CORRIGÉ — Suppression communauté sans nettoyage des données orphelines
- **Fichier :** `supabase/migrations/20260322_cascade_delete_community.sql`
- **Fix :** `ON DELETE CASCADE` ajouté sur toutes les FK liées à `communities` (members, events, bets, shop, forum, tournaments, features, stat_schemas, announcements).

### [SEC-10] ✅ CORRIGÉ — Race condition à la création de communauté
- **Fichiers :** `supabase/migrations/20260322_rpc_create_community.sql` + `src/app/onboarding/page.tsx`
- **Fix :** RPC PostgreSQL `create_community_transactional()` — tous les INSERT/UPDATE de l'onboarding (community + member + features + stat_schema) exécutés en une seule transaction atomique. Si l'un échoue, tout est annulé.

---

## Bonnes pratiques en place ✅

- **RLS (Row Level Security)** activé sur toutes les tables Supabase sensibles
- **Service Role Key** uniquement côté serveur (API routes, jamais exposée au client)
- **Emails via Resend** : confirmation et magic links gérés server-side
- **HTTPS** enforced via Vercel
- **Variables d'env** : séparation `NEXT_PUBLIC_*` (client) vs variables privées (serveur)
- **Middleware de protection** sur `/dashboard` (+ email confirmé) et `/superadmin` (+ rôle DB)
- **Formules de score** évaluées via `safe-eval.ts` (pas de `eval()` natif)
- **Création communauté** atomique via RPC PostgreSQL transactionnelle
- **Suppression communauté** avec CASCADE DELETE sur toutes les tables liées

---

## Actions restantes

Aucun point de sécurité ouvert. Prochaine étape recommandée : audit après intégration Stripe (webhooks, validation des paiements côté serveur).
