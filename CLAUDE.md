# Bikawo — Instructions Claude Code

## Stack
Vite + React 18 + TypeScript + Supabase + Stripe Connect + Playwright

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
