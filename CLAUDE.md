# Bikawo — Instructions Claude Code

## Stack
Vite + React 18 + TypeScript + Supabase + Stripe Connect + Playwright

## Prérequis Playwright
WebKit et Firefox requièrent une installation séparée avant de lancer la suite complète :
```
npx playwright install --with-deps
```
Sans cette commande, tous les tests WebKit/Firefox échouent avec "Executable doesn't exist".
Les tests Chromium seuls (`--project=chromium`) fonctionnent sans dépendances supplémentaires.

## Langue de travail
Toujours répondre en français.

## Workflow obligatoire avant chaque commit

1. **Afficher le diff** (`git diff --staged`) avant de commiter — ne jamais commiter sans le montrer.
2. **Lancer les tests E2E** après chaque modification fonctionnelle :
   ```
   npx playwright test --reporter=line
   ```
   Un commit ne part que si les tests passent (ou si l'échec est documenté et hors périmètre du fix).

## Règles de sécurité — non négociables

### Edge Functions admin
- `Access-Control-Allow-Origin` doit toujours être `'https://bikawo.com'` dans toutes les fonctions `admin-*`.
- Jamais de `'*'` sur un endpoint admin, même temporairement.

### Clé service role
- `SUPABASE_SERVICE_ROLE_KEY` est interdit dans tout endpoint accessible sans authentification préalable.
- Toute Edge Function qui accepte des requêtes anonymes utilise `SUPABASE_ANON_KEY` + JWT forwarding.

### Inputs OpenAI
- Tout message utilisateur envoyé à OpenAI doit passer par `sanitizeMessage()` (max 500 chars, strip control chars).
- Le message doit être encadré dans `[USER_INPUT]...[/USER_INPUT]` dans le rôle `user`.
- Une blocklist regex doit être vérifiée avant chaque appel OpenAI.

## Instructions de compaction du contexte (/compact)

Lors d'un `/compact`, conserver impérativement :

1. **Résultats de tests** — nombre passants/échoués (ex : "186/186 Playwright")
2. **Findings de sécurité** — toute vulnérabilité identifiée avec fichier:ligne et sévérité
3. **Règles de workflow actives** — diff avant commit, tests avant push
4. **État de l'audit SEO** — axes complétés, pages restant à traiter
5. **Pages orphelines identifiées** — `/reservation`, `/demande-personnalisee`, `/panier-demo`
6. **Décisions d'architecture** — pourquoi `workers:2`, pourquoi `testIgnore` sur `.role.spec.ts`, pourquoi anon key sur le chatbot
7. **Structure des credentials MCP** — noms des variables d'env GSC (sans valeurs)

Ne pas conserver : contenu complet des fichiers modifiés (lisibles via `Read`), historique git détaillé.

## Environnement de développement

Ce projet n'utilise pas Lovable.
Tout le développement se fait via Claude Code + VS Code.
**Ne jamais écrire de code en dehors de `apps/` ou `packages/`.**

## Architecture monorepo

C'est un monorepo pnpm :
- `apps/public/` → `bikawo.com` (site public — clients et prestataires)
- `apps/admin/`  → `admin.bikawo.com` (backoffice admin)
- `packages/shared/` → code partagé entre les deux apps

### Règles inter-apps — non négociables
- Ne jamais importer depuis `apps/admin` dans `apps/public` — tout partagé passe par `@bikawo/shared`.
- Ne jamais hardcoder les URLs `bikawo.com` — utiliser les variables d'environnement.
- Ne jamais hardcoder l'URL du projet Supabase — utiliser `import.meta.env.VITE_SUPABASE_URL` côté frontend et `Deno.env.get('SUPABASE_URL')` côté Edge Functions.
- Ne jamais hardcoder de domaine Lovable (`lovable.dev`, `lovableproject.com`) — le projet n'utilise pas Lovable.
- La allowlist CORS vit dans `packages/shared/cors.ts`.

### apps/admin — session et déploiement
- `apps/admin` est déployé sur `admin.bikawo.com` — domaine séparé de `bikawo.com`.
- La session admin est scopée à `admin.bikawo.com` : un admin doit se connecter sur `/login` de l'app admin, indépendamment de toute session active sur bikawo.com. **C'est le comportement attendu**, pas un bug.
- Port de dev : 5174 (`apps/public` reste sur 5173).

## Règles d'architecture — non négociables
- Ne jamais appeler `supabase.from()` ou `supabase.rpc()` directement depuis un composant React — passer par `src/services/` ou `src/hooks/queries/`.
- Toute nouvelle Edge Function doit utiliser Stripe `apiVersion: "2025-08-27.basil"`.
- Aucun nouveau composant ne dépasse 300 lignes — extraire dans un hook si le fichier grossit.
- Aucun `TODO` sans numéro d'issue GitHub : `// TODO #123`.

## Règles de structure des composants
- Quand on modifie un composant de plus de 400 lignes, extraire la logique touchée dans un hook dédié ou un sous-composant dans le cadre de la modification.
- Ne jamais refactoriser des composants non touchés.

## Règles générales
- Ne pas commiter `.env` (contient des secrets).
- Ne pas commiter `supabase/.temp/`, `test-results/`, `tests/auth-states/`.
- Toujours utiliser `has_role(auth.uid(), 'admin')` pour vérifier les droits admin — jamais une table `admin_users` directement.
- Les factures PDF ne doivent **jamais** contenir de mention "DOCUMENT PROVISOIRE", disclaimer d'invalité fiscale, ou tout texte invalidant leur valeur légale. Les informations légales obligatoires (SIRET, mentions TVA SAP, pénalités de retard) doivent être présentes sur chaque facture émise.
- Les secrets `BIKAWO_SIRET`, `BIKAWO_ADDRESS`, `BIKAWO_PHONE` doivent être configurés dans Supabase avant la mise en production pour que les factures soient légalement valides.

## Règle critique — synchronisation trigger / fonction DB

`calculate_financial_breakdown` et le trigger `create_financial_transaction` doivent **toujours** avoir des signatures d'arguments identiques.

Ne jamais modifier l'un sans mettre à jour l'autre. Après tout changement, vérifier avec :
```sql
SELECT proname, pg_get_function_arguments(oid)
FROM pg_proc
WHERE proname IN (
  'calculate_financial_breakdown',
  'create_financial_transaction'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```
Les deux signatures doivent correspondre avant tout déploiement.

## Dépendances Excel

`exceljs` est la bibliothèque d'export Excel du monorepo. Elle est lazy-loaded dans `apps/admin` uniquement.
- Bundle : 938 kB raw / 270 kB gzip — acceptable pour l'usage admin.
- **Ne jamais importer `exceljs` dans `apps/public`.**
- `xlsx` (SheetJS) est banni — 2 CVE HIGH non corrigées (GHSA-4r6h-8v6p-xvw6, GHSA-4w7w-66w2-5vf9).

## Vulnérabilités connues acceptées (dev-only)

Ces vulnérabilités sont présentes dans `pnpm audit` mais n'affectent pas le runtime de production :
- **esbuild HIGH** GHSA-67mh-4wv8-2f99 : vérification d'intégrité binaire (contexte Deno uniquement)
- **esbuild MODERATE** GHSA-gv7w-rqvm-qjhr : dev server uniquement
- **vite MODERATE** GHSA-4w7w-66w2-5vf9 : path traversal dev server uniquement
- **uuid MODERATE** GHSA-w5hq-g745-h8pq : dépendance transitive de exceljs — non exploitable via le code applicatif

## Risques connus acceptés (runtime)

- **W4 — Guest checkout race condition** : Si l'email du guest existe déjà dans `auth.users`, le lien `password_setup` peut ne pas être envoyé. Monitoring : chercher dans les logs `verify-payment` "already registered" sans email envoyé. Fix prévu : sprint v2.
- **W5 — URSSAF async non-atomique** : Le booking est confirmé avant l'envoi de la déclaration URSSAF. Si `urssaf-register-service` échoue, le booking existe sans déclaration. Monitoring manuel requis : vérifier la table `urssaf_declarations` chaque semaine pour les entrées `status='error'`.
- **W6 — `service_id` null sur certains bookings** : Si le nom de service dans les métadonnées Stripe ne correspond pas à la base, le booking est créé avec `service_id=null`. Une notification admin est créée. Vérifier les notifications admin quotidiennement pour les alertes "SERVICE NON IDENTIFIÉ".

## Règles métier Bikawo — non négociables

### Paiements (R1–R5)
- **R1** : Tout paiement Stripe confirmé doit avoir un booking en DB. Si le booking échoue après paiement → déclencher un remboursement automatique via `stripe.refunds.create()`.
- **R2** : Le statut `booking_confirmed` requiert un paiement validé (`payment_status = 'completed'`).
- **R3** : Échec paiement → booking `payment_failed` + email client + notification admin.
- **R4** : Remboursement → booking `refunded` + email client + `financial_transactions.payment_status = 'refunded'`.
- **R5** : Idempotence sur `stripe_session_id` — ne jamais traiter deux fois la même session. Vérifier dans `bookings.notes` via `ilike('%stripe_session:${id}%')`.

### Machine d'états booking (R6)
Statuts valides et transitions autorisées :
```
pending_payment → paid → booking_confirmed
booking_confirmed → in_progress → completed
* → cancelled | refunded | payment_failed | disputed
pending_provider → booking_confirmed
```
- Ne jamais écrire un statut hors de cette liste.
- La contrainte CHECK `bookings_status_check` l'enforce en DB (migration `20260614000001`).
- `confirmed` est le statut legacy actif dans `verify-payment` — équivalent de `booking_confirmed`.

### Champs obligatoires booking (R8)
Chaque booking doit avoir :
- `client_id` OU `guest_email` (pas les deux null)
- `booking_date`, `start_time`, `end_time`
- `address`
- `total_price > 0`

### Visibilité (R10)
Tout changement de statut booking doit se refléter immédiatement dans :
`bookings` + `financial_transactions` + notification client + notification admin.

### Prestataires (R13–R14)
- **R13** : Le paiement prestataire est déclenché uniquement quand `booking.status = 'completed'`.
- **R14** : Double-booking interdit. Vérifier la disponibilité avant assignation.

### Emails client (R15)
Le client reçoit un email pour : `booking_confirmed`, `cancelled`, `refunded`, `payment_failed`, `completed`.
Obligation : chaque envoi est dans un `try/catch` — l'échec email ne bloque jamais le flux principal. En cas d'échec, créer une notification admin `type: 'email_failure'`.

### Facturation (R17–R19)
- **R17** : Tout booking payé génère une facture.
- **R18** : Les factures sont immuables après création.
- **R19** : `financial_transaction` auto-créée par trigger DB sur INSERT/UPDATE du booking.

## Règles d'implémentation enforced — non négociables

### R7 ENFORCED — Double-booking (verify-payment)
`verify-payment` calcule `busyProviderIds` avant toute assignation : requête sur `bookings` avec `booking_date` + overlap `start_time < endTime AND end_time > startTime` + statuts `confirmed/pending_urssaf/in_progress`. Ne jamais supprimer ce check.

### R9 ENFORCED — Politique annulation client (handle-cancellation)
`handle-cancellation` recalcule server-side `refundAmount` et `refundPercentage` pour `cancelledBy === 'client'` :
- `> 24h` avant la prestation → 100 %
- `2h–24h` → 50 %
- `≤ 2h` → 0 %

Seul `refundReason === 'admin_manual_override'` peut passer outre. Ne jamais faire confiance au `refundAmount` du caller pour les annulations client.

### Storage — Buckets provider
`provider-applications` et `provider-documents` sont restreints à **10 MB** + **PDF/JPEG/PNG/WebP** uniquement (migration `20260614000003`). Ne pas élargir sans migration et approbation explicite.

## Règle critique — CORS et ENVIRONMENT

`ENVIRONMENT=production` doit être configuré dans les secrets Supabase.
Ne jamais importer `activeCorsHeaders` depuis `_shared/cors.ts` dans une nouvelle Edge Function — utiliser `corsHeaders` directement ou `getAdminCorsHeaders()` pour les fonctions admin.

## PROVIDER SPACE RULES

- **R-PROV-01** : Ne jamais afficher `total_price` (prix client) au prestataire. Afficher uniquement `provider_payment` depuis `financial_transactions`. Pour les opportunités (bookings non assignés), aucun prix n'est affiché (pas de `financial_transaction` encore).
- **R-PROV-02** : Le badge "Missions actives" ne compte que les missions avec `status IN ('confirmed', 'in_progress')` ET `booking_date >= CURRENT_DATE`.
- **R-PROV-03** : Transitions de statut prestataire : `confirmed → in_progress` (Commencer), `in_progress → completed` (Terminer). Chaque transition `completed` doit invoquer `transfer-provider-payment` avec `action:'transfer_single'` et le `transactionId` de `financial_transactions`. En cas d'échec, créer une notification `type:'payment_transfer_failed'`.
- **R-PROV-04** : Le numéro de téléphone du client n'est affiché que pour les missions `confirmed` ou `in_progress`, et uniquement si `profiles.phone` est non-null.
- **R-PROV-05** : Toute communication passe par la messagerie interne. Naviguer vers `/espace-prestataire` avec query param `?tab=messages&booking={id}`. Route dédiée `/messages` prévue en v2.
- **R-PROV-06** : L'itinéraire ouvre `https://maps.google.com/?q={booking.address}` dans un nouvel onglet. Affiché uniquement si `booking.address` est renseigné.
- **R-PROV-07** : Les photos sont uploadées dans le bucket `provider-documents`, chemin `missions/{booking_id}/{timestamp}_{filename}`. Contraintes : max 10 MB, formats PDF/JPEG/PNG/WebP uniquement (enforced par migration `20260614000003`).

## CLIENT SPACE RULES

- **R-CLI-01** : Attestation fiscale disponible uniquement pour les bookings `status = 'completed'` ET `services.urssaf_eligible = true`. Document distinct de la facture — généré via EF `generate-attestation-pdf`. Ne jamais rediriger vers l'onglet attestations globales à la place.
- **R-CLI-02** : Bouton "Mon avis" disponible uniquement pour les bookings `status = 'completed'`. Ouvre `DetailedRatingForm` en dialog directement sur ce booking. Ne jamais utiliser `navigate()` qui perd le contexte.
- **R-CLI-03** : Bouton "Litige" disponible uniquement pour les bookings `status = 'completed'` ET dans les 30 jours suivant `completed_at`. Jamais pour les bookings annulés ni à venir. Vérifier via `canDispute()` dans `ClientPrestationsHistory`.
- **R-CLI-04** : Signalement d'anomalie requiert un sélecteur de type obligatoire : `retard | absence | qualite | attitude | autre`. Le type est mappé vers `complaint_type` et `priority` dans la table `complaints`. Ne jamais hardcoder `'quality'` pour tous les signalements.
- **R-CLI-05** : Le calcul du crédit d'impôt utilise `services.urssaf_eligible` depuis la DB (jamais une blacklist de noms hardcodée). Progress bar = `eligibleAmount / 12000`. Crédit estimé = `eligibleAmount × 0.5` avec affichage "X€ / 6 000€ max".
- **R-CLI-06** : Format des codes parrainage : `BIKA-XXXXX` (5 chars alphanum). Généré par `generate_referral_code()`. Le formulaire d'inscription capture `?ref=` depuis l'URL et propose un champ code parrain. Appliquer via RPC `create_referral_from_code(p_referral_code, p_referred_email, 'client')`. Parrain client = 20€, prestataire = 30€.
- **R-CLI-07** : Historique complet dans `ClientPrestationsHistory` : 4 onglets (À venir / En cours / Passées / Annulées), filtres période + tri, pagination 10/page.
- **R-CLI-08** : Les factures sont immuables après création (R-18). Téléchargement via EF `generate-invoice-pdf` avec `invoiceId`. Disponibles dans `ClientPrestationsHistory` (tab Passées) ET dans l'onglet Factures de l'espace personnel.

## CATALOGUE ET SÉLECTION — RÈGLES NON NÉGOCIABLES

- **R-SEL-01** : Catalogue public — tous les services sont visibles sans connexion. Pour les services `urssaf_eligible = true`, afficher le prix réel après crédit d'impôt : `prix/h → prix×0.5/h réel*`. Mention légale `*après crédit d'impôt 50% (art. 199 sexdecies CGI)`. Implémenté dans `BikaServiceBooking.tsx` (modal de réservation) et `ServicesGrid.tsx` (carte catalogue).
- **R-SEL-02** : Filtre géographique — demander le code postal avant d'afficher les prestataires disponibles. Implémenter via `useProviderZoneCheck(postalCode)` qui query `providers.postal_codes @> ARRAY[postalCode]` avec `is_verified = true`. Ne jamais laisser un client payer sans code postal valide.
- **R-SEL-03** : Transparence tarifaire — décomposer le prix affiché : `Prix total : X€ / Crédit d'impôt (50%) : −Y€ / Votre coût réel : Z€`. Stripe fees jamais affichées au client (absorbées dans la commission Bikawo). Décomposition dans `BikaServiceBooking.tsx` et `Payment.tsx` (param URL `urssaf_eligible=true`).
- **R-SEL-04** : Indisponibilité — si `useProviderZoneCheck` retourne `count = 0`, bloquer le handler `addToCart` et afficher : "Service disponible prochainement dans votre secteur". Ne jamais permettre un paiement sans prestataire disponible dans la zone. Message avec numéro de contact : 06 09 08 53 90.
- **R-SEL-05** : Informations obligatoires avant ajout panier — date, heure début, heure fin, adresse exacte, code postal. Notes : optionnel. Enforced par button `disabled` + guard dans `handleAddToCart`.
- **R-SEL-06** : Validation date — minimum J+1 (pas de réservation le jour même), maximum J+90. Dimanche : toast avertissement "disponibilité non garantie". Enforced dans `BikaServiceBooking.tsx` (Calendar `disabled` prop) ET dans `useBikawoCart.addToCart` (double-check server-side).
- **R-SEL-07** : Durée — minimum 2h (déjà enforced), maximum 8h. Si durée > 4h → pause obligatoire 30 min non facturée : `getBillableHours() = duration > 4 ? duration - 0.5 : duration`. Le `quantity` dans le panier = heures facturables (pas la durée totale).
- **R-SEL-08** : Panier — maximum 5 services différents (enforced dans `useBikawoCart.addToCart`). Expiration 30 min via `bikawo-cart-timestamp` (déjà implémentée). "Un seul prestataire par réservation" = contrainte server-side au moment de l'assignation (non enforçable au panier). Prix recalculé automatiquement via `price × quantity`.
