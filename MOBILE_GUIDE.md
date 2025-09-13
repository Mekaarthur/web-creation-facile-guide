# Guide Mobile Bikawo 📱

Ce guide explique comment transformer votre application Bikawo en application mobile native avec Capacitor.

## 🚀 Pour tester immédiatement

L'application fonctionne déjà en mobile web ! Vous pouvez :
- Accéder à l'URL de prévisualisation sur votre téléphone
- L'ajouter à votre écran d'accueil via le navigateur
- Profiter de toutes les fonctionnalités optimisées mobile

## 📦 Pour créer une vraie app native

### 1. Exporter vers GitHub
Cliquez sur le bouton "Export to Github" dans Lovable pour transférer votre projet.

### 2. Installation locale
```bash
git clone [votre-repo-github]
cd [nom-du-projet]
npm install
```

### 3. Initialiser Capacitor
```bash
npx cap init
```

### 4. Ajouter les plateformes
```bash
# Pour Android
npx cap add android

# Pour iOS (macOS requis)
npx cap add ios
```

### 5. Build et synchronisation
```bash
npm run build
npx cap sync
```

### 6. Lancer l'application
```bash
# Android
npx cap run android

# iOS (sur macOS avec Xcode)
npx cap run ios
```

## 🎯 Fonctionnalités mobiles ajoutées

### ✅ Interface adaptée
- Navigation mobile optimisée
- Composants responsive
- Gestes tactiles
- Interface native

### ✅ Capacités natives
- Géolocalisation intégrée
- Appels téléphoniques directs
- Ouverture d'applications de cartes
- Caméra pour photos de profil

### ✅ Performance
- Chargement optimisé
- Cache intelligent
- Synchronisation hors ligne
- Animations fluides

## 🔧 Prérequis système

### Pour Android
- Android Studio installé
- SDK Android configuré
- Émulateur ou appareil Android

### Pour iOS
- macOS uniquement
- Xcode installé
- Compte développeur Apple (pour déploiement)
- Simulateur iOS ou iPhone/iPad

## 📚 Ressources utiles

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Lovable Mobile](https://lovable.dev/blogs/TODO)
- [Support Capacitor](https://github.com/ionic-team/capacitor)

## 🔄 Mise à jour de l'app

Après chaque modification du code :
1. `git pull` pour récupérer les changements
2. `npm run build` pour compiler
3. `npx cap sync` pour synchroniser les changements
4. Relancer l'application

## 🎨 Personnalisation

L'application utilise déjà :
- Thème sombre/clair adaptatif
- Couleurs de marque Bikawo
- Animations et transitions natives
- Interface intuitive et moderne

## 📧 Support

Pour toute question sur le développement mobile, consultez :
- La documentation Lovable
- Le Discord de la communauté Lovable
- La documentation officielle Capacitor