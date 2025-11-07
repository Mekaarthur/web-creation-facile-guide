# Tests de Sécurité et Cloisonnement - Bikawo

## 🎯 Objectif

Vérifier que le système de rôles et de cloisonnement fonctionne correctement et qu'aucun utilisateur ne peut accéder à des pages non autorisées.

## ✅ Tests à Effectuer

### 1. Test de Déconnexion Complète

**Objectif :** Vérifier que les tokens et cookies sont bien détruits

**Étapes :**
1. Se connecter avec n'importe quel compte
2. Ouvrir les DevTools (F12) → Application → Local Storage
3. Noter les clés supabase présentes
4. Cliquer sur "Déconnexion"
5. **Résultat attendu :**
   - ✅ Redirection immédiate vers `/`
   - ✅ Toutes les clés supabase supprimées du localStorage
   - ✅ sessionStorage vidé
   - ✅ Impossible d'accéder aux pages protégées
6. Tenter d'accéder à `/espace-personnel` directement
   - ✅ Doit rediriger vers `/auth`

---

### 2. Test Client → Provider (Accès Croisé)

**Objectif :** Un client ne doit PAS pouvoir accéder à l'espace prestataire

**Étapes :**
1. Se connecter avec un compte **client uniquement**
2. Dans la barre d'URL, taper manuellement : `/espace-prestataire`
3. Appuyer sur Entrée
4. **Résultat attendu :**
   - ✅ Redirection automatique vers `/espace-personnel`
   - ✅ Message d'erreur "Accès refusé"
   - ✅ Aucune donnée de l'espace prestataire ne s'affiche

**Vérification DB :**
```sql
-- Vérifier que l'utilisateur n'a QUE le rôle client
SELECT * FROM user_roles WHERE user_id = 'user-id-here';
-- Résultat attendu : role = 'client' uniquement
```

---

### 3. Test Provider → Client (Accès Croisé)

**Objectif :** Un prestataire ne doit PAS pouvoir accéder à l'espace client

**Étapes :**
1. Se connecter avec un compte **provider uniquement**
2. Dans la barre d'URL, taper : `/espace-personnel`
3. **Résultat attendu :**
   - ✅ Redirection automatique vers `/espace-prestataire`
   - ✅ Message d'erreur si nécessaire

---

### 4. Test Provider/Client → Admin (Accès Croisé)

**Objectif :** Les non-admins ne doivent PAS accéder à l'espace admin

**Étapes :**
1. Se connecter avec un compte client ou provider (sans rôle admin)
2. Taper dans l'URL : `/modern-admin`
3. **Résultat attendu :**
   - ✅ Redirection immédiate vers `/espace-personnel` ou `/espace-prestataire`
   - ✅ Message "Accès Refusé - Permissions insuffisantes"
   - ✅ Aucune donnée admin visible

**Test API :**
```javascript
// Dans la console du navigateur
const { data } = await supabase.functions.invoke('verify-user-role', {
  body: { role: 'admin' }
});
console.log(data.hasRole); // Doit être false
```

---

### 5. Test Admin → Tous les Espaces

**Objectif :** Les admins doivent pouvoir accéder à tous les espaces

**Étapes :**
1. Se connecter avec un compte **admin**
2. Accéder successivement à :
   - `/modern-admin` ✅
   - `/espace-personnel` ✅ (pour supervision)
   - `/espace-prestataire` ✅ (pour supervision)
3. **Résultat attendu :**
   - ✅ Tous les espaces accessibles
   - ✅ Pas de redirection automatique

---

### 6. Test Redirection Automatique Post-Login

**Objectif :** Chaque utilisateur doit être redirigé vers SON espace

**Étapes :**
1. Se déconnecter complètement
2. Se connecter en tant que **client**
   - ✅ Doit aller sur `/espace-personnel`
3. Se déconnecter
4. Se connecter en tant que **provider**
   - ✅ Doit aller sur `/espace-prestataire`
5. Se déconnecter
6. Se connecter en tant qu'**admin**
   - ✅ Doit aller sur `/modern-admin`

---

### 7. Test Backend - Politiques RLS

**Objectif :** Vérifier que les politiques RLS empêchent l'accès aux données

**Test 1 - Client essaie de voir tous les providers :**
```javascript
// Console navigateur (connecté en client)
const { data, error } = await supabase
  .from('providers')
  .select('*');
console.log(data); // Doit être vide ou erreur RLS
```

**Test 2 - Provider essaie de modifier un autre provider :**
```javascript
// Console navigateur (connecté en provider)
const { error } = await supabase
  .from('providers')
  .update({ hourly_rate: 999 })
  .eq('user_id', 'autre-user-id');
console.log(error); // Doit avoir une erreur RLS
```

**Test 3 - Non-admin essaie d'ajouter un rôle :**
```javascript
// Console navigateur (connecté en client ou provider)
const { error } = await supabase.rpc('add_user_role', {
  target_user_id: 'some-user-id',
  new_role: 'admin'
});
console.log(error); // Doit retourner "Only admins can assign roles"
```

---

### 8. Test Edge Function de Vérification

**Objectif :** Vérifier que l'edge function valide correctement les rôles

**Test :**
```javascript
// Client test
const { data: clientTest } = await supabase.functions.invoke('verify-user-role', {
  body: { role: 'admin' }
});
console.log('Client trying admin:', clientTest.hasRole); // false

// Admin test
const { data: adminTest } = await supabase.functions.invoke('verify-user-role', {
  body: { role: 'admin' }
});
console.log('Admin trying admin:', adminTest.hasRole); // true
```

---

### 9. Test Persistance de Session

**Objectif :** La session doit persister après rechargement

**Étapes :**
1. Se connecter en tant que client
2. Rafraîchir la page (F5)
3. **Résultat attendu :**
   - ✅ Toujours connecté
   - ✅ Rôles toujours présents
   - ✅ Pas de nouvelle authentification requise

---

### 10. Test Multi-Rôles

**Objectif :** Un utilisateur avec plusieurs rôles doit voir son rôle principal priorisé

**Étapes :**
1. Créer un utilisateur avec rôles `admin` ET `provider`
2. Se connecter
3. **Résultat attendu :**
   - ✅ `primaryRole` = 'admin' (priorité la plus haute)
   - ✅ Redirection vers `/modern-admin`
   - ✅ Peut quand même accéder à `/espace-prestataire` (multi-rôle)

---

## 🐛 Cas d'Erreur à Tester

### Tentative de Manipulation du localStorage

**Attaque simulée :**
```javascript
// Essayer de se donner le rôle admin en local
localStorage.setItem('fake_admin', 'true');
// Recharger la page
```

**Résultat attendu :**
- ✅ Le système ignore le localStorage
- ✅ Seuls les rôles de la DB sont pris en compte
- ✅ Pas d'accès admin accordé

---

### Tentative d'Accès Direct aux APIs

**Attaque simulée :**
```javascript
// Client essayant d'appeler une API admin
const { data, error } = await supabase
  .from('admin_actions_log')
  .select('*');
```

**Résultat attendu :**
- ✅ Erreur RLS
- ✅ Aucune donnée retournée
- ✅ Tentative potentiellement loguée

---

## 📊 Matrice d'Accès Attendue

| Rôle     | /espace-personnel | /espace-prestataire | /modern-admin | /auth |
|----------|-------------------|---------------------|---------------|-------|
| Client   | ✅ Oui            | ❌ Non → Redirect   | ❌ Non → Redirect | ✅ Oui |
| Provider | ❌ Non → Redirect | ✅ Oui              | ❌ Non → Redirect | ✅ Oui |
| Admin    | ✅ Oui            | ✅ Oui              | ✅ Oui         | ✅ Oui |

---

## 🔧 Commandes de Test SQL

### Voir tous les rôles d'un utilisateur
```sql
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
```

### Voir le rôle principal
```sql
SELECT get_primary_role('your-user-id');
```

### Vérifier si un user a un rôle
```sql
SELECT has_role('your-user-id', 'admin');
```

### Ajouter un rôle manuellement (admin requis)
```sql
SELECT add_user_role('target-user-id', 'provider');
```

---

## ✅ Checklist de Validation

- [ ] Client ne peut pas accéder à l'espace prestataire
- [ ] Provider ne peut pas accéder à l'espace client
- [ ] Non-admin ne peut pas accéder à l'espace admin
- [ ] Déconnexion détruit tous les tokens/cookies
- [ ] Refresh de page maintient la session
- [ ] Redirection automatique selon le rôle après login
- [ ] RLS empêche l'accès aux données non autorisées
- [ ] Edge functions vérifient les rôles côté serveur
- [ ] Manipulation localStorage n'accorde pas de privilèges
- [ ] Multi-rôles fonctionne correctement (priorité respectée)

---

## 🚨 Que Faire en Cas d'Échec

1. **Vérifier les migrations** : Toutes les migrations SQL doivent être appliquées
2. **Vérifier le cache** : Vider le cache du navigateur (Ctrl+Shift+Delete)
3. **Vérifier les logs** : Console navigateur + Supabase logs
4. **Re-déployer** : S'assurer que les edge functions sont déployées
5. **Tester en navigation privée** : Éliminer les problèmes de cache

---

**Créé le :** 2025-11-07  
**Dernière mise à jour :** 2025-11-07