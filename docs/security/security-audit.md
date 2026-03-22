# Audit Sécurité — The Circle

> Dernière mise à jour : 22/03/2026

---

## Résumé des risques

| Niveau | Nombre | État |
|---|---|---|
| 🔴 Critique | 3 | 3 corrigés |
| 🟠 Élevé | 4 | 2 corrigés / 2 partiels |
| 🟡 Moyen | 3 | 1 corrigé / 2 ouverts |

---

## 🔴 CRITIQUE

### [SEC-1] ✅ CORRIGÉ — Injection via `new Function()` dans les formules de score
- **Fichier :** `src/lib/safe-eval.ts`
- **Risque :** Exécution de code arbitraire côté serveur/client via les formules de scoring custom
- **Fix appliqué :** Whitelist de caractères autorisés, blacklist des identifiants dangereux (`eval`, `fetch`, `window`, `localStorage`, `process`). Validation à la sauvegarde.

### [SEC-2] ✅ CORRIGÉ — Token d'invitation prédictible (= slug communauté)
- **Fichier :** `supabase/migrations/20260321_add_invite_token.sql`
- **Risque :** N'importe qui connaissant le slug pouvait rejoindre une communauté privée
- **Fix appliqué :** Colonne `invite_token uuid DEFAULT gen_random_uuid()` sur `communities`. Token UUID validé en DB.

### [SEC-3] ✅ CORRIGÉ — Accès superadmin sans vérification en DB
- **Fichier :** `src/proxy.ts`
- **Risque :** Un utilisateur pouvait accéder à `/superadmin` en manipulant son token JWT
- **Fix appliqué :** Middleware vérifie `profiles.global_role = 'superadmin'` en base avant d'autoriser l'accès.

---

## 🟠 ÉLEVÉ

### [SEC-4] ✅ CORRIGÉ — Absence de types DB (risque d'injection SQL via ORM mal typé)
- **Fichier :** `src/types/database.types.ts` (1251 lignes générées le 21/03/2026)
- **Fix appliqué :** Types Supabase générés via `npm run gen:types`, toutes les requêtes sont typées.

### [SEC-5] ⚠️ PARTIEL — Enforcement modules non vérifié sur toutes les routes
- **Risque :** Un utilisateur peut accéder directement à une URL de module désactivé
- **État :** `/c/[slug]/events` et `/c/[slug]/leaderboard` retournent 404 si désactivé ✅
- **Reste à faire :** Vérifier `/c/[slug]/tournaments`, `/c/[slug]/bets`, `/c/[slug]/shop`, `/c/[slug]/forum`

### [SEC-6] ⚠️ OUVERT — Injection CSS via `theme_json`
- **Fichiers concernés :** Toutes les pages vitrine utilisant `theme.primaryColor`, `theme.accentColor`
- **Risque :** Si un owner injecte `red; background: url(evil)` comme couleur, les styles inline peuvent être manipulés
- **Fix recommandé :**
```ts
// src/lib/validate-theme.ts
function isValidColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) ||
         /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(value)
}
```
Valider à la sauvegarde du thème dans `AppearanceClient.tsx`.

### [SEC-7] ✅ CORRIGÉ — `console.log('[DEBUG leaderboard]', ...)` en production
- **Fichier :** `src/app/c/[slug]/leaderboard/page.tsx`
- **Fix appliqué :** Supprimé lors de l'audit du 21/03/2026.

---

## 🟡 MOYEN

### [SEC-8] ⚠️ OUVERT — Pas d'enforcement email verification
- **Risque :** Un utilisateur peut se connecter avec un email non confirmé (brute force de comptes)
- **Fix recommandé :** Vérifier `email_confirmed_at` dans le middleware ou à la connexion
```ts
// Dans proxy.ts ou login handler
const { data: { user } } = await supabase.auth.getUser()
if (user && !user.email_confirmed_at) {
  return NextResponse.redirect('/login?error=email_not_confirmed')
}
```

### [SEC-9] ⚠️ OUVERT — Suppression communauté sans nettoyage des données orphelines
- **Fichier :** `src/app/(dashboard)/dashboard/[slug]/settings/SettingsClient.tsx`
- **Risque :** DELETE sur `communities` laisse des données orphelines (`community_members`, `events`, `bets`, etc.) en base
- **Fix recommandé :** CASCADE DELETE en base (migration SQL) ou nettoyage séquentiel applicatif

### [SEC-10] ⚠️ OUVERT — Race condition à la création de communauté
- **Fichier :** `src/app/onboarding/`
- **Risque :** Les INSERT séquentiels (community → member → features → stat_schema) sans transaction peuvent créer des communautés en état partiel si l'un échoue
- **Fix recommandé :** Supabase RPC PostgreSQL transactionnelle ou Edge Function

---

## Bonnes pratiques en place ✅

- **RLS (Row Level Security)** activé sur toutes les tables Supabase sensibles
- **Service Role Key** uniquement côté serveur (jamais exposée au client)
- **Emails via Resend** : confirmation d'inscription et magic links gérés server-side via API routes (pas exposés au client)
- **HTTPS** enforced via Vercel
- **Variables d'env** : séparation `NEXT_PUBLIC_*` (client) vs variables privées (serveur)
- **Middleware de protection** sur `/dashboard` et `/superadmin`
- **Formules de score** évaluées via `safe-eval.ts` (pas de `eval()` natif)

---

## Plan d'action prioritaire

| Priorité | Item | Effort estimé |
|---|---|---|
| 🔴 Faire maintenant | SEC-6 : Valider les couleurs du thème | 30 min |
| 🟠 Prochaine session | SEC-5 : Enforcement modules manquants | 1h |
| 🟠 Prochaine session | SEC-8 : Vérification email confirmation | 30 min |
| 🟡 Quand possible | SEC-9 : CASCADE DELETE communauté | 1h |
| 🟡 Quand possible | SEC-10 : Transaction onboarding | 2h |
