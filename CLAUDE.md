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

## Triggers DB — en attente de révision (ne pas toucher sans investigation)

Audit du 2026-06-24 : 5 triggers DANGEROUS supprimés (migration `20260624000002`). Les 5 suivants nécessitent une investigation complémentaire avant décision :

- **`trigger_generate_provider_invoice`** (`generate_provider_invoice_on_completion`) : Génère un record `provider_invoices` quand `booking.status = 'completed'`. Utilise 70% hardcodé au lieu de `financial_transactions.provider_payment`. À investiguer : `transfer-provider-payment` ne crée pas les records — ce trigger est peut-être nécessaire. Fix requis : remplacer les 70% par une jointure sur `financial_transactions`.
- **`trigger_compensate_provider_late_cancel`** (`compensate_provider_on_late_cancellation`) : Insère dans `provider_compensations` (30% hardcodé) pour annulations < 2h. Chevauchement possible avec `handle-cancellation` EF (R9). Vérifier si `provider_compensations` est utilisé en frontend avant de supprimer.
- **`trigger_send_provider_assigned`** (`send_provider_assigned_email`) : Envoie `type='provider_assigned'` au client quand `provider_id` change sur UPDATE. `verify-payment` envoie une notification prestataire distincte — pas clairement doublon. Utile pour les réassignations admin.
- **`trigger_send_review_request`** (`send_review_request_on_completion`) : Appelle `send-review-request` EF sur `status='completed'`. `send-mission-status-update` (ligne 190) fait de même. **Doublon probable** — double demande d'avis au client. À confirmer selon le flow provider exact.
- **`create_prestation_on_completion`** (`create_prestation_from_booking`) : Crée un record `prestations_realisees` sur completion (17€/hr hardcodé). Double update de `providers.total_earnings` avec `update_provider_earnings_trigger`. `prestations_realisees` non utilisé en frontend (grep 2026-06-24). Candidat DROP.

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

## R-SRV-01 — Produits de ménage (FORFAIT)

- slug: `produits-menage`
- price: **2.50€ fixe** — JAMAIS multiplié par les heures
- quantity: toujours 1, `isForfait: true` dans `servicesData.ts` et `BikawoCartItem`
- `getBillableHours()` et `getTotalPrice()` court-circuitent si `service.isForfait`
- `verify-payment` : `normalizeService` force `quantity=1` si `slug='produits-menage'`
- `total_price` en DB = 2.50€ (via `effectiveTotalPrice`)
- Tous les autres services sont **horaires** (`price × hours`)

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
- **R-SEL-02 (final)** : Le client ne voit JAMAIS la disponibilité d'un prestataire — ni avant, ni après réservation. Le code postal est collecté uniquement à des fins logistiques (adresse d'intervention, assignation interne du prestataire côté serveur via `find_providers_in_zone` dans `verify-payment`). Aucun composant frontend ne doit afficher un compteur/statut de prestataires disponibles.
- **R-SEL-03** : Transparence tarifaire — décomposer le prix affiché : `Prix total : X€ / Crédit d'impôt (50%) : −Y€ / Votre coût réel : Z€`. Stripe fees jamais affichées au client (absorbées dans la commission Bikawo). Décomposition dans `BikaServiceBooking.tsx` et `Payment.tsx` (param URL `urssaf_eligible=true`).
- **R-SEL-04 (final)** : Supprimé — remplacé par R-SEL-06 (final). Il n'existe plus de blocage `addToCart` basé sur la disponibilité prestataire ; `useProviderZoneCheck` et `bookingService.hasAvailableProviderInZone` ont été supprimés (code mort).
- **R-SEL-05** : Informations obligatoires avant ajout panier — date, heure début, heure fin, adresse exacte, code postal. Notes : optionnel. Enforced par button `disabled` + guard dans `handleAddToCart`.
- **R-SEL-06 (final)** : Validation du délai de réservation basée sur les heures ouvrées Bikawo (7j/7, 8h-20h, calculées par `calculateWorkingHours()` / `getBookingValidation()` dans `apps/public/src/utils/workingHours.ts` — source de vérité unique, jamais dupliquer la logique). Délai minimum : 5h ouvrées avant la prestation (sinon créneau refusé). Zone urgente : 5h–10h ouvrées → `isUrgent = true`, déclenche une alerte admin priorité (attribution manuelle). Zone normale : >10h ouvrées. Aucune exception week-end/jour férié. Exemption pour les services nuit/urgence (`NIGHT_SERVICE_SLUGS` : `urgences-24-7`, `gardes-de-nuit-urgence`, `courses-urgentes-nuit`, cf. R-SEL-17) qui suivent leurs propres règles de créneau et sont toujours considérés comme urgents. Mirroré côté serveur dans `supabase/functions/_shared/workingHours.ts` (Deno ne peut pas importer le code frontend — duplication acceptée, ne jamais modifier l'un sans l'autre) : `create-payment` rejette (400, `"Ce créneau n'est plus disponible."`) si <5h ouvrées et calcule `is_urgent` dans les métadonnées Stripe (override de toute valeur envoyée par le client) ; `verify-payment` envoie une notification admin `type: 'urgent_booking'` priorité `urgent` si `metadata.is_urgent === '1'`.
- **R-SEL-07** : Durée — minimum 2h (déjà enforced), maximum 8h. Si durée > 4h → pause obligatoire 30 min non facturée : `getBillableHours() = duration > 4 ? duration - 0.5 : duration`. Le `quantity` dans le panier = heures facturables (pas la durée totale).
- **R-SEL-08** : Panier — maximum 5 services différents (enforced dans `useBikawoCart.addToCart`). Expiration 30 min via `bikawo-cart-timestamp` (déjà implémentée). "Un seul prestataire par réservation" = contrainte server-side au moment de l'assignation (non enforçable au panier). Prix recalculé automatiquement via `price × quantity`.
- **R-SEL-09** : Le client explore et configure sa réservation sans être connecté. La connexion n'est demandée qu'au moment de "Procéder au paiement" — jamais bloquer la découverte. Route `/payment` non protégée par `ProtectedRoute` dans `App.tsx`.
- **R-SEL-10** : Guest checkout — à l'étape paiement (`BookingCheckout.tsx`), proposer 2 options si non connecté (`authChoice: 'pending'`) : "Créer un compte" (recommandé, redirige vers `/auth?redirect=/panier`) ou "Continuer sans compte" (`authChoice: 'guest'`, affiche le formulaire). Le guest reçoit un email de setup mot de passe après paiement (déjà géré côté `verify-payment`).
- **R-SEL-11** : Si client connecté, pré-remplir adresse (et infos profil) depuis `profileService.getProfile()` — dans `BikaServiceBooking.tsx` (adresse) et `BookingCheckout.tsx` (nom, email, téléphone, adresse). Ne jamais écraser une valeur déjà saisie par l'utilisateur.
- **R-SEL-12 (final)** : Avant `create-payment`, `BookingCheckout.runPreflightChecks()` vérifie : panier non expiré (< 30 min via `bikawo-cart-timestamp`), montant > 0, délai de réservation valide via `getBookingValidation()` (cf. R-SEL-06 final — jamais de vérification de disponibilité prestataire), adresse renseignée, pas de double réservation client sur le créneau (`bookingService.hasConflictingBooking`, cf. R7). Échec → message précis en toast, client reste sur la page, aucune navigation.
- **R-SEL-13** : Récapitulatif complet avant paiement (`CartSummaryItems` + carte desktop/mobile dans `BookingCheckout.tsx`) : service + sous-service, date/heure/durée, adresse, prix total, crédit d'impôt estimé, bouton "Confirmer et payer", lien CGV (`/cgu`) + politique d'annulation.
- **R-SEL-14** : Politique d'annulation affichée avant paiement (desktop card + mobile sticky CTA dans `BookingCheckout.tsx`) : >24h gratuite, 2h–24h 50% remboursé, <2h non remboursé — cohérent avec R9 ENFORCED (`handle-cancellation`).
- **R-SEL-15** : Services URSSAF — `UrssafSection` n'est proposée que si le panier contient au moins un service `urssaf_eligible` (`hasEligibleItems` dans `BookingCheckout.tsx`). La réduction de 50% ne porte que sur le sous-total des services éligibles (`eligibleTotal`), jamais sur tout le panier. Si non activée : texte explicite "vous payez 100% maintenant, crédit d'impôt récupérable en fin d'année" (`UrssafSection.tsx`). Jamais d'activation automatique — `enabled` reste `false` par défaut.
- **R-SEL-16** : Bika Plus (`bika_plus`) n'a pas de réservation en ligne directe. `BikaPlus.tsx` ne rend plus `ServiceBookingForm` — tous les CTA redirigent vers `/demande-personnalisee` (devis sous 24h, paiement après validation du devis).
- **R-SEL-17** : Sous-services spéciaux gérés par `slug` dans `BikaServiceBooking.tsx` (prop `service.slug`, propagé depuis `SubService.tsx` et `ServiceSubgrid.tsx`) :
  - `urgences-24-7` (seniors) : disponible 24h/24 7j/7, l'avertissement "disponibilité dimanche" est désactivé, badge "majoration +50% incluse".
  - `gardes-de-nuit-urgence` (kids) : créneaux horaires restreints à 20h-8h (`availableTimeSlots` dédié), validation bloquante si hors fenêtre nuit, `calculateDuration()` gère le passage de minuit.
  - `courses-urgentes-nuit` (maison) : réservation le jour même autorisée (J+1 non appliqué via `isUrgentDelay`), le créneau doit débuter dans les 2h suivant la commande si la date choisie est aujourd'hui.
- **R-SEL-18** : Récurrence proposée après la 1ère réservation, sur `PaymentSuccess.tsx` (clients connectés uniquement), via le composant `RecurringBookingOptions` déjà existant. Persistée dans la table `recurring_bookings` (migration `20260616000001`) via `recurringBookingService.create()`. Réduction fidélité -5% à partir de la 3e réservation (`recurringBookingService.getCompletedBookingsCount() >= 2`), appliquée dans `BookingCheckout.tsx` après l'avance URSSAF (`isLoyaltyEligible`). Annulation de la récurrence sans frais si demandée ≥7 jours avant la prochaine occurrence (`recurringBookingService.cancel()`). **Hors périmètre** : génération automatique des réservations futures et facturation récurrente (nécessiterait un cron + Edge Function dédiés).

## Recrutement prestataire — règles non négociables

- **R-RECR-01** : Documents obligatoires pour candidature : `identity_document`, `siret_document`, `rib_iban`. Schéma `z.instanceof(File)` dans `validations.ts` (pas de `.refine()` qui laisse passer `null`). Documents optionnels : `criminal_record`, `certification_nova`, `rc_pro`, `certifications`.
- **R-RECR-02** : NOVA (`certification_nova`) est **optionnel**. Ne jamais bloquer une candidature ou un onboarding faute d'agrément NOVA. L'env `NOVA_REQUIRED=false` désactive le cron `check-nova-expirations` et marque l'onglet admin avec une bannière info.
- **R-RECR-03** : Étapes onboarding prestataire : **Documents → Mandat → Validation** (3 étapes). L'étape Formation a été supprimée. La grille de progression est en `grid-cols-3`. Fichiers : `useProviderOnboarding.tsx` (STEPS_BASE), `provider/Onboarding.tsx` (steps + currentStep logic).
- **R-RECR-04** : Mandat de facturation = **checkbox d'acceptation uniquement** (plus de pad de signature). Composant `MandateSignature.tsx`. Met à jour `providers.mandat_facturation_accepte + mandat_signature_date`.
- **R-RECR-05** : Approbation côté serveur (Level 2) dans `admin-applications/index.ts` → `approveApplication()` : vérifie que `identity_document_url`, `siret_document_url`, `rib_iban_url` sont non-null avant de créer le provider. Retourne 400 si un doc manque. Après création, copie les docs vers `provider_documents` (status `pending`) et set `documents_submitted=true` → le provider skip l'étape upload en onboarding.
- **R-RECR-06** : Email post-approbation : type `provider_application_approved` via `send-transactional-email`. Template `_templates/provider-application-approved.tsx`. Contient le lien de setup mot de passe (recovery link Supabase). Remplace l'ancien `password_setup` pour les prestataires approuvés.
- **R-RECR-07** : Bouton "Approuver" dans `ApplicationDetails.tsx` est `disabled` si un des 3 docs obligatoires (`identity_document_url`, `siret_document_url`, `rib_iban_url`) est null dans `job_applications`. Un encart rouge liste les docs manquants. La protection Level 2 côté serveur (R-RECR-05) reste en fallback même si l'UI est contournée.

