# Conformité Légale & RGPD — The Circle

> Dernière mise à jour : 22/03/2026
> Ce document liste les obligations légales, l'état actuel de conformité, et les actions à mener.

---

## 1. RGPD (Règlement Général sur la Protection des Données)

### Données collectées

| Donnée | Où | Pourquoi | Base légale |
|---|---|---|---|
| Email | `auth.users` (Supabase) | Authentification | Contrat |
| Pseudo (`display_name`) | `profiles` | Identification | Contrat |
| Avatar | Supabase Storage | Personnalisation | Consentement |
| Stats custom | `community_members.custom_stats` | Fonctionnement communauté | Contrat |
| Badges, points | `community_members` | Gamification | Contrat |
| Adresse IP | Logs Vercel/Supabase | Sécurité | Intérêt légitime |

### Droits des utilisateurs

| Droit | État | Action requise |
|---|---|---|
| **Droit d'accès** | ❌ Non implémenté | Ajouter page "Mes données" dans le profil |
| **Droit de rectification** | ✅ Partiel | Le pseudo est modifiable. Email via Supabase Auth. |
| **Droit à l'effacement** | ❌ Non implémenté | Ajouter bouton "Supprimer mon compte" avec suppression en cascade |
| **Droit à la portabilité** | ❌ Non implémenté | Export JSON des données personnelles |
| **Droit d'opposition** | ❌ Non implémenté | Opt-out des emails transactionnels |
| **Consentement cookies** | ✅ Bandeau RGPD présent | Cookie banner déjà en place sur la vitrine |

### Sous-traitants (Article 28 RGPD)

| Sous-traitant | Usage | Localisation | DPA signé |
|---|---|---|---|
| **Supabase** | Base de données, Auth, Storage | USA (AWS us-east-1) | ✅ Supabase DPA disponible |
| **Vercel** | Hébergement, CDN | USA + Edge mondial | ✅ Vercel DPA disponible |
| **Resend** | Emails transactionnels | USA | ⚠️ À vérifier |
| **Stripe** (futur) | Paiements | USA | ✅ Stripe DPA disponible |

> ⚠️ **Transfert hors UE :** Supabase et Vercel sont aux USA. Les transferts sont couverts par les clauses contractuelles types (SCCs) de l'UE. Mentionner dans la politique de confidentialité.

### Durée de conservation

| Donnée | Durée recommandée | État |
|---|---|---|
| Comptes inactifs | 3 ans après dernière connexion | ❌ Pas de purge automatique |
| Logs applicatifs | 1 an | Dépend de Vercel/Supabase |
| Données supprimées | Immédiat | ❌ Pas de suppression effective |

---

## 2. Pages légales

| Page | État | Fichier |
|---|---|---|
| **Mentions légales** | ✅ Présente | `src/app/(vitrine)/mentions-legales/page.tsx` |
| **Politique de confidentialité** | ✅ Présente | `src/app/(vitrine)/confidentialite/page.tsx` |
| **CGU** | ✅ Présente | `src/app/(vitrine)/cgu/page.tsx` |
| **Bandeau cookies** | ✅ Présent | Composant dans le layout vitrine |

### Points à vérifier dans les pages légales

- [ ] **Mentions légales** : nom/prénom ou raison sociale de l'éditeur, adresse, SIRET si applicable, hébergeur (Vercel)
- [ ] **Politique de confidentialité** : liste des sous-traitants avec leurs pays, durées de conservation, droits des utilisateurs avec email de contact
- [ ] **CGU** : clause sur le contenu généré par les utilisateurs (UGC), responsabilité des owners de communauté, conditions de suspension de compte
- [ ] **Email de contact RGPD** : définir `dpo@the-circle.pro` ou une adresse dédiée aux demandes RGPD

---

## 3. Sécurité des données (Article 32 RGPD)

| Mesure | État |
|---|---|
| Chiffrement en transit (HTTPS) | ✅ Vercel force HTTPS |
| Chiffrement au repos | ✅ Supabase chiffre les données au repos |
| Accès par rôle (RLS) | ✅ Row Level Security activé |
| Mots de passe hashés | ✅ Géré par Supabase Auth (bcrypt) |
| Logs d'accès | ✅ Vercel + Supabase logs |
| Authentification forte | ⚠️ Pas de 2FA proposé aux utilisateurs |

---

## 4. Cookies & Tracking

### Cookies utilisés

| Cookie | Type | Durée | Nécessaire |
|---|---|---|---|
| `sb-*` (Supabase session) | Session Auth | ~1 semaine | ✅ Oui |
| Vercel Analytics | Analytics | Session | ⚠️ Consentement requis |
| Speed Insights (Vercel) | Performance | Session | ⚠️ Consentement requis |

> Le bandeau cookies est en place. Vérifier qu'il bloque effectivement Vercel Analytics avant consentement.

---

## 5. Emails transactionnels (conformité CAN-SPAM / Directive ePrivacy)

| Règle | État |
|---|---|
| Expéditeur identifiable | ✅ `noreply@the-circle.pro` |
| Lien de désinscription | ❌ Absent dans les emails actuels |
| Pas d'email commercial sans consentement | ✅ Emails uniquement transactionnels |

> Ajouter un footer dans tous les emails Resend avec : "Cet email a été envoyé car vous avez créé un compte sur The Circle. [Se désinscrire]"

---

## 6. Actions prioritaires RGPD

| Priorité | Action | Effort |
|---|---|---|
| 🔴 Critique | Ajouter bouton "Supprimer mon compte" | 2h |
| 🔴 Critique | Page "Mes données" avec export | 3h |
| 🟠 Important | Footer de désinscription dans les emails Resend | 30 min |
| 🟠 Important | Vérifier DPA Resend | 15 min |
| 🟡 Moyen | Purge automatique des comptes inactifs (3 ans) | 2h |
| 🟡 Moyen | Proposer 2FA aux utilisateurs | 4h |

---

## 7. Responsabilité des Owners de communauté

Les owners sont des **sous-responsables de traitement** au sens du RGPD. Ils collectent des données sur leurs membres (stats, candidatures, etc.).

**Points à clarifier dans les CGU :**
- L'owner est responsable des données qu'il collecte sur ses membres
- The Circle fournit l'outil, pas la responsabilité éditoriale
- Droit de The Circle à supprimer les communautés ne respectant pas les CGU
- Interdiction explicite : données sensibles (santé, politique, religion) dans les stats custom
