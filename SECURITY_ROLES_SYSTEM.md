# Système de Sécurité et Gestion des Rôles - Bikawo

## 📋 Vue d'ensemble

Ce document décrit le système complet de sécurité et de gestion des rôles mis en place sur la plateforme Bikawo.

## 🔐 Architecture de Sécurité

### 1. Rôles Disponibles

Le système utilise l'enum `app_role` avec les valeurs suivantes (par ordre de priorité) :

1. **admin** - Administrateur complet
2. **provider** - Prestataire de services
3. **client** - Client utilisateur
4. **moderator** - Modérateur (accès admin limité)
5. **user** - Utilisateur de base (legacy, migré vers client)

### 2. Table `user_roles`

**Structure :**
```sql
- id (uuid, PK)
- user_id (uuid, FK vers auth.users)
- role (app_role)
- created_at (timestamp)
- created_by (uuid, FK vers auth.users)
- UNIQUE(user_id, role) -- Un utilisateur peut avoir plusieurs rôles
```

**Politiques RLS :**
- Utilisateurs voient leurs propres rôles
- Admins voient tous les rôles
- Admins peuvent gérer tous les rôles
- Système peut créer des rôles initiaux

## 🛡️ Fonctions de Sécurité Backend

### Fonctions Principales

#### `has_role(_user_id uuid, _role app_role) -> boolean`
Vérifie si un utilisateur possède un rôle spécifique.
- **SECURITY DEFINER** : Évite la récursion RLS
- Utilisée dans toutes les politiques RLS

#### `get_user_roles(_user_id uuid) -> SETOF app_role`
Retourne tous les rôles d'un utilisateur.

#### `get_primary_role(_user_id uuid) -> app_role`
Retourne le rôle principal selon la priorité (admin > provider > client).

#### `add_user_role(target_user_id uuid, new_role app_role)`
Ajoute un rôle à un utilisateur (admin seulement).
- Crée automatiquement une entrée dans `providers` si rôle = 'provider'

#### `remove_user_role(target_user_id uuid, old_role app_role)`
Retire un rôle (admin seulement).
- Empêche de retirer le dernier rôle d'un utilisateur

### Trigger Automatique

#### `handle_new_user()`
Déclenché à la création d'un nouveau compte :
1. Crée automatiquement un profil dans `profiles`
2. Assigne le rôle `client` par défaut

## 🎯 Protection des Routes Frontend

### Composants de Guard

#### `ProtectedRoute`
- **Usage** : Routes clients uniquement
- **Redirections** :
  - Non-authentifié → `/auth`
  - Admin/Moderator → `/modern-admin`
  - Provider → `/espace-prestataire`

#### `ProtectedProviderRoute`
- **Usage** : Routes prestataires uniquement
- **Redirections** :
  - Non-authentifié → `/auth/provider`
  - Client → `/espace-personnel`
  - Admin → `/modern-admin`

#### `AdminRoute`
- **Usage** : Routes administrateurs uniquement
- **Redirections** :
  - Non-authentifié → `/auth`
  - Provider → `/espace-prestataire`
  - Client → `/espace-personnel`

### Hook `useAuth` Amélioré

**Nouvelles propriétés :**
```typescript
{
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];           // Tous les rôles de l'utilisateur
  primaryRole: UserRole | null; // Rôle principal
  hasRole: (role: UserRole) => boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}
```

**Méthode `signOut()` sécurisée :**
- Appelle `supabase.auth.signOut()`
- Nettoie `localStorage` et `sessionStorage`
- Clear les états utilisateur, session et rôles
- Détruit tous les tokens

## 🚀 Flux d'Authentification

### Connexion
1. Utilisateur se connecte via `/auth` ou `/auth/provider`
2. Supabase authentifie et crée une session
3. Hook `useAuth` récupère la session
4. Fetch automatique des rôles depuis `user_roles`
5. Détermination du rôle principal
6. Redirection automatique vers l'espace approprié

### Navigation
1. Utilisateur clique sur un lien ou tape une URL
2. Guard de route vérifie l'authentification
3. Guard vérifie les rôles requis
4. Si autorisé → Affiche la page
5. Si non autorisé → Redirige vers l'espace approprié

### Déconnexion
1. Utilisateur clique sur "Déconnexion"
2. Appel `supabase.auth.signOut()`
3. Nettoyage complet du localStorage
4. Nettoyage du sessionStorage
5. Clear des états React
6. Redirection vers `/`
7. Force reload de la page

## 🔒 Cloisonnement des Accès

### Par Rôle

#### Client
- ✅ Accès : `/espace-personnel`, `/reservation`, `/payment`
- ❌ Refus : `/espace-prestataire`, `/modern-admin`

#### Provider
- ✅ Accès : `/espace-prestataire`, `/provider-onboarding`
- ❌ Refus : `/espace-personnel`, `/modern-admin`

#### Admin
- ✅ Accès : `/modern-admin`, `/admin/*`, `/audit-qualite`
- ✅ Peut voir tous les espaces (supervision)

## 🔍 Sécurité Backend

### Edge Function: `verify-user-role`

**Endpoint :** `/functions/v1/verify-user-role`

**Usage :**
```typescript
const { data } = await supabase.functions.invoke('verify-user-role', {
  body: { 
    role: 'admin',
    userId: 'optional-user-id' // Par défaut = utilisateur connecté
  }
});

if (data.hasRole) {
  // Utilisateur a le rôle requis
}
```

**Sécurité :**
- Vérifie le JWT token de l'utilisateur
- Utilise la fonction `has_role` de la DB
- Retourne tous les rôles de l'utilisateur
- Logging complet des vérifications

### Politiques RLS sur Tables Sensibles

Toutes les tables sensibles utilisent `has_role()` dans leurs politiques :

```sql
-- Exemple : Table providers
CREATE POLICY "Admin can view all providers"
  ON public.providers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

## 📊 Tests de Sécurité

### Tests à Effectuer

1. **Test Déconnexion :**
   - Se connecter en tant que client
   - Se déconnecter
   - Vérifier que les cookies sont détruits
   - Tenter d'accéder à `/espace-personnel` → Doit rediriger vers `/auth`

2. **Test Accès Croisé :**
   - Se connecter en tant que client
   - Taper manuellement `/espace-prestataire` dans l'URL
   - Doit rediriger vers `/espace-personnel`

3. **Test Admin :**
   - Se connecter en tant qu'admin
   - Doit accéder à `/modern-admin`
   - Ne doit PAS être bloqué sur les autres espaces (supervision)

4. **Test Provider :**
   - Se connecter en tant que prestataire
   - Taper `/espace-personnel` → Redirection `/espace-prestataire`
   - Taper `/modern-admin` → Redirection `/espace-prestataire`

## 🔧 Maintenance

### Ajouter un Rôle à un Utilisateur (via SQL)

```sql
-- Via fonction sécurisée (recommandé)
SELECT add_user_role('user-uuid-here', 'provider');

-- Direct (admin seulement)
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('user-uuid-here', 'provider', NOW())
ON CONFLICT DO NOTHING;
```

### Retirer un Rôle

```sql
SELECT remove_user_role('user-uuid-here', 'provider');
```

### Vérifier les Rôles d'un Utilisateur

```sql
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';

-- Ou via fonction
SELECT get_primary_role('user-uuid-here');
```

## ⚠️ Points d'Attention

1. **Ne jamais stocker de rôles dans localStorage** - Toujours fetch depuis la DB
2. **Toujours vérifier les rôles côté backend** - Les guards frontend ne suffisent pas
3. **Logger les tentatives d'accès non autorisées** - Pour détecter les attaques
4. **Nettoyer complètement lors de la déconnexion** - Sessions, localStorage, sessionStorage
5. **Utiliser SECURITY DEFINER avec précaution** - Seulement pour éviter la récursion RLS

## 📝 Checklist de Sécurité

- [x] Table `user_roles` avec RLS activé
- [x] Enum `app_role` avec tous les rôles nécessaires
- [x] Fonction `has_role()` pour vérification sécurisée
- [x] Trigger automatique d'assignation de rôle
- [x] Guards de routes frontend (ProtectedRoute, AdminRoute, etc.)
- [x] Hook `useAuth` avec gestion des rôles
- [x] Edge function de vérification des rôles
- [x] Déconnexion sécurisée avec nettoyage complet
- [x] Redirection automatique selon le rôle
- [x] Cloisonnement des accès par URL
- [x] Logging des tentatives d'accès

## 🚀 Prochaines Améliorations

- [ ] Dashboard de monitoring des accès
- [ ] Alertes en temps réel pour tentatives d'accès non autorisées
- [ ] Rate limiting par rôle
- [ ] Audit trail complet des actions admin
- [ ] 2FA pour les admins

---

**Document créé le :** 2025-11-07  
**Dernière mise à jour :** 2025-11-07  
**Version :** 1.0