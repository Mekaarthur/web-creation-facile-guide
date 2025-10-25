# 🧪 Guide de Tests Manuels - Authentification

Ce guide vous permet de tester manuellement les 3 niveaux de protection sans dépendances externes.

---

## 🎯 Pré-requis

- Navigateur web (Chrome/Firefox recommandé)
- Console DevTools ouverte (F12)
- 3 comptes de test :
  - ✉️ Client : `client@test.com`
  - 👷 Prestataire : `provider@test.com`
  - 🔒 Admin : `admin@bikawo.com`

---

## ✅ Test 1: Protection Route Client (`/espace-personnel`)

### Étape 1: Sans connexion
```
1. Ouvrir navigation privée
2. Aller sur: http://localhost:8080/espace-personnel
3. ✅ ATTENDU: Redirection automatique vers /auth
4. ✅ VÉRIFIER: Page de connexion affichée
```

### Étape 2: Avec connexion client
```
1. Se connecter avec email client
2. ✅ ATTENDU: Accès à /espace-personnel
3. ✅ VÉRIFIER: Dashboard client visible
4. ✅ VÉRIFIER: Onglets: Dashboard, Rendez-vous, Factures, etc.
```

### Étape 3: Navigation
```
1. Cliquer sur différents onglets
2. ✅ ATTENDU: Contenu change sans rechargement
3. ✅ VÉRIFIER: Pas d'erreurs dans console
```

**Résultat attendu**: ✅ Client peut accéder à son espace

---

## ✅ Test 2: Protection Route Prestataire (`/espace-prestataire`)

### Étape 1: Avec compte client (non prestataire)
```
1. Se connecter comme CLIENT
2. Aller sur: /espace-prestataire
3. ✅ ATTENDU: Message "Accès restreint"
4. ✅ VÉRIFIER: Bouton "Devenir prestataire" visible
5. ✅ VÉRIFIER: Bouton "Retour à l'espace client" visible
```

### Étape 2: Avec prestataire non vérifié
```
1. Se connecter comme PRESTATAIRE (is_verified = false)
2. Aller sur: /espace-prestataire
3. ✅ ATTENDU: Message "Accès restreint"
4. ✅ VÉRIFIER: Message expliquant la vérification nécessaire
```

### Étape 3: Avec prestataire vérifié
```
1. Se connecter comme PRESTATAIRE VÉRIFIÉ (is_verified = true)
2. Aller sur: /espace-prestataire
3. ✅ ATTENDU: Dashboard prestataire visible
4. ✅ VÉRIFIER: Missions, calendrier, etc. accessibles
```

**Résultat attendu**: ✅ Seuls prestataires vérifiés accèdent

---

## ✅ Test 3: Protection Route Admin (`/admin`)

### Étape 1: Avec compte client
```
1. Se connecter comme CLIENT
2. Aller sur: /admin
3. ✅ ATTENDU: Écran de chargement puis "Accès Refusé"
4. ✅ VÉRIFIER: Icône Shield rouge visible
5. ✅ VÉRIFIER: Message "Vous n'avez pas les permissions"
```

### Étape 2: Avec compte prestataire
```
1. Se connecter comme PRESTATAIRE
2. Aller sur: /admin
3. ✅ ATTENDU: "Accès Refusé"
4. ✅ VÉRIFIER: Même comportement que client
```

### Étape 3: Avec compte admin
```
1. Se connecter comme ADMIN
2. Aller sur: /admin
3. ✅ ATTENDU: Panel d'administration visible
4. ✅ VÉRIFIER: Menu latéral avec toutes les options
5. ✅ VÉRIFIER: Dashboard, Utilisateurs, Prestataires, etc.
```

### Étape 4: Vérifier Edge Function
```
1. Ouvrir DevTools > Network
2. Se connecter comme admin
3. Aller sur /admin
4. ✅ VÉRIFIER: Appel à "get-user-role" dans Network
5. ✅ VÉRIFIER: Header "Authorization: Bearer ..."
6. ✅ VÉRIFIER: Réponse { role: "admin" }
```

**Résultat attendu**: ✅ Seuls admins accèdent + edge function appelée

---

## 🔒 Test 4: Sécurité Anti-Bypass

### Test localStorage Manipulation
```
1. Se connecter comme CLIENT (non admin)
2. Ouvrir Console DevTools
3. Taper:
   localStorage.setItem('isAdmin', 'true');
   localStorage.setItem('userRole', 'admin');
4. Actualiser la page
5. Aller sur /admin
6. ✅ ATTENDU: "Accès Refusé" malgré localStorage
7. ✅ VÉRIFIER: Edge function vérifie côté serveur
8. ✅ VÉRIFIER: Impossible de contourner
```

### Test Session Manipulation
```
1. Se connecter comme CLIENT
2. Ouvrir DevTools > Application > Storage
3. Modifier "supabase.auth.token"
4. Actualiser la page
5. ✅ ATTENDU: Déconnexion automatique
6. ✅ VÉRIFIER: Redirection vers /auth
```

**Résultat attendu**: ✅ Impossible de contourner les protections

---

## ⚡ Test 5: Performance & UX

### Test Loading States
```
1. Se connecter
2. Aller rapidement sur /admin
3. ✅ VÉRIFIER: Écran de chargement visible
4. ✅ VÉRIFIER: Message "Vérification des autorisations..."
5. ✅ VÉRIFIER: Pas de flash de contenu protégé
```

### Test Redirections
```
1. Se déconnecter
2. Aller sur /espace-personnel
3. ✅ VÉRIFIER: Redirection immédiate vers /auth
4. ✅ VÉRIFIER: Pas de flash de contenu
5. ✅ VÉRIFIER: URL change correctement
```

**Résultat attendu**: ✅ UX fluide sans flash de contenu

---

## 📊 Checklist Complète

### Routes Clients
- [ ] Non connecté → redirigé vers /auth
- [ ] Client connecté → accès dashboard
- [ ] Navigation entre onglets fluide
- [ ] Déconnexion fonctionne

### Routes Prestataires
- [ ] Client → accès refusé avec message
- [ ] Prestataire non vérifié → accès refusé
- [ ] Prestataire vérifié → accès dashboard
- [ ] Boutons "Devenir prestataire" visibles

### Routes Admin
- [ ] Client → accès refusé
- [ ] Prestataire → accès refusé
- [ ] Admin → accès dashboard
- [ ] Edge function appelée avec token
- [ ] Logs dans console (check Network)

### Sécurité
- [ ] localStorage manipulation bloquée
- [ ] Session manipulation détectée
- [ ] Pas de contournement possible
- [ ] Messages d'erreur clairs

### Performance
- [ ] Loading states visibles
- [ ] Pas de flash de contenu
- [ ] Redirections rapides
- [ ] Pas d'erreurs console

---

## 🐛 Debugging

### Si redirection ne fonctionne pas
```javascript
// Console DevTools
console.log('User:', user);
console.log('Session:', session);
console.log('Loading:', loading);
```

### Si admin access refusé à tort
```javascript
// Vérifier rôle dans DB
SELECT * FROM user_roles WHERE user_id = 'votre-user-id';

// Vérifier edge function
const { data } = await supabase.functions.invoke('get-user-role');
console.log('Role:', data);
```

### Si prestataire non reconnu
```javascript
// Vérifier profil provider
SELECT * FROM providers WHERE user_id = 'votre-user-id';

// Doit avoir: is_verified = true
```

---

## 📈 Résultats Attendus

| Test | Client | Prestataire | Admin |
|------|--------|-------------|-------|
| `/espace-personnel` | ✅ | ✅ | ✅ |
| `/espace-prestataire` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |
| Anti-bypass | ✅ | ✅ | ✅ |

---

## 🎯 Temps Estimé

- **Test complet**: 15-20 minutes
- **Test rapide**: 5 minutes
- **Test sécurité**: 10 minutes

---

## ✅ Validation Finale

Une fois tous les tests passés :

```
✅ Routes protégées fonctionnent
✅ Redirections correctes
✅ Messages d'erreur clairs
✅ Edge functions sécurisées
✅ Anti-bypass efficace
✅ Loading states présents

🎉 Système d'authentification validé !
```

---

## 📞 Support

Si un test échoue :
1. Vérifier les logs console (F12)
2. Vérifier Network tab pour edge functions
3. Vérifier base de données (user_roles, providers)
4. Nettoyer cache & cookies
5. Tester en navigation privée

**Bon tests ! 🚀**
