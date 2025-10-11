# 📚 Documentation Bikawo - Plateforme de Services à Domicile

## 🎯 Vue d'ensemble

Bikawo est une plateforme complète de gestion de services à domicile avec système de réservation, communication multi-canal, gestion d'urgences et analytics avancés.

## 🏗️ Architecture

### Technologies Principales
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Communication**: Emails (Resend), SMS (Twilio), Push Notifications
- **Charts**: Recharts
- **État**: React Query + Supabase Realtime

### Structure du Projet
```
src/
├── components/          # Composants React réutilisables
│   ├── admin/          # Dashboards et outils admin
│   │   ├── analytics/  # Analytics avancés
│   │   ├── finance/    # Gestion financière
│   │   └── moderation/ # Modération contenu
│   └── ui/             # Composants UI de base (shadcn)
├── hooks/              # Hooks React personnalisés
│   ├── useWorkflowEmails.tsx        # Emails automatiques
│   └── useEmergencyOrchestration.tsx # Gestion urgences
├── services/           # Services métier
│   ├── communicationOrchestrator.ts # Orchestration multi-canal
│   ├── smsService.ts                # Envoi SMS critiques
│   └── pushNotificationService.ts   # Notifications push
├── pages/              # Pages de l'application
└── integrations/       # Intégrations externes (Supabase)

supabase/
├── functions/          # Edge Functions Deno
│   ├── send-critical-sms/           # SMS urgents Twilio
│   └── send-transactional-email/    # Emails transactionnels
└── migrations/         # Migrations base de données
```

## 🚀 Fonctionnalités Principales

### 1. Système de Réservation
- Réservation de services en ligne
- Assignation automatique de prestataires
- Workflow de statuts complet (pending → assigned → confirmed → in_progress → completed)
- Gestion des annulations et remboursements

### 2. Communication Multi-Canal
**Orchestrateur de Communications** (`communicationOrchestrator.ts`)
- **Emails** : Confirmations, rappels, notifications via Resend
- **SMS** : Messages critiques (annulations, urgences) via Twilio
- **Push** : Notifications temps réel dans l'app

**Déclencheurs Automatiques** :
- ✅ Réservation confirmée → Email + Push
- ⏰ 24h avant → Rappel Email + Push
- ▶️ Mission démarrée → Push
- ✅ Mission terminée → Email + Push
- 🚨 Urgence → Email + SMS + Push

### 3. Gestion des Urgences
**Dashboard Urgences** (`EmergencyDashboard.tsx`)
- Alertes temps réel via Supabase Realtime
- Pool de prestataires backup
- Attribution rapide en 1 clic
- Protocole d'escalade aux admins

**Cas d'urgence** :
- Annulation de dernière minute (< 2h)
- Absence du prestataire
- Remplacement urgent nécessaire

### 4. Modération & Qualité
**Dashboard Modération** (`ModerationDashboard.tsx`)
- Validation des avis clients
- Gestion des signalements
- Suspension utilisateurs
- Historique des actions de modération

### 5. Analytics Avancés
**Dashboard Analytics** (`AdvancedAnalytics.tsx`)
- KPIs en temps réel
- Graphiques de tendances (réservations, revenus)
- Performance des prestataires
- Répartition par catégorie de service

### 6. Finance
**Dashboard Financier** (`FinanceDashboard.tsx`)
- Suivi des transactions clients
- Calcul automatique des commissions
- Gestion des paiements prestataires
- Export CSV des rapports

## 🔧 Configuration

### Variables d'Environnement
```env
VITE_SUPABASE_URL=https://cgrosjzmbgxmtvwxictr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1...
```

### Secrets Supabase (Edge Functions)
```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxx

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+33xxxxxxxxx

# Push Notifications
VAPID_PUBLIC_KEY=xxxxx
```

## 📊 Base de Données

### Tables Principales
- **bookings** : Réservations de services
- **providers** : Prestataires de services
- **profiles** : Profils utilisateurs
- **services** : Catalogue de services
- **reviews** : Avis clients
- **financial_transactions** : Transactions financières
- **emergency_assignments** : Assignations d'urgence
- **notification_logs** : Historique notifications
- **realtime_notifications** : Notifications temps réel

### RLS (Row Level Security)
Toutes les tables sont protégées par des politiques RLS strictes :
- Utilisateurs peuvent uniquement voir leurs propres données
- Admins ont accès complet via `has_role(auth.uid(), 'admin')`
- Prestataires accèdent uniquement à leurs missions

### Triggers Importants
- **create_financial_transaction()** : Crée automatiquement les transactions financières
- **auto_assign_booking()** : Assigne automatiquement un prestataire
- **update_provider_rating()** : Met à jour la note des prestataires

## 🔐 Sécurité

### Authentification
- Gestion via Supabase Auth
- Rôles : `client`, `provider`, `admin`
- Table `user_roles` séparée (évite escalade de privilèges)

### Validation des Entrées
- Tous les formulaires utilisent Zod pour la validation
- Sanitisation des données côté serveur
- Protection CSRF native de Supabase

### RLS Policies
- Isolation stricte des données par utilisateur
- Fonctions `security definer` pour les opérations sensibles
- Jamais de requêtes directes sensibles côté client

## 🧪 Tests & Performance

### Tests de Charge
Pour tester la plateforme :
1. Créer 100+ utilisateurs test
2. Simuler 1000 réservations simultanées
3. Vérifier temps de réponse < 2s
4. Monitoring via Supabase Dashboard

### Monitoring
- Logs Edge Functions : Supabase Dashboard
- Analytics : Google Analytics (optionnel)
- Errors : Sentry (optionnel)

## 📱 Notifications Push Web

### Initialisation
```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Demander la permission
await pushNotificationService.requestPermission();

// S'abonner
await pushNotificationService.subscribe();

// Envoyer une notification test
await pushNotificationService.sendTestNotification(
  'Test',
  'Message de test'
);
```

### Service Worker
Le fichier `public/sw.js` gère l'affichage des notifications push.

## 🔄 Workflows Automatiques

### Workflow Email (Réservation)
1. **Réservation créée** → Email confirmation + Push
2. **Prestataire assigné** → Email avec infos prestataire
3. **Réservation confirmée** → Email récapitulatif + Rappel 24h
4. **Mission démarrée** → Push notification
5. **Mission terminée** → Email + Demande d'avis

### Workflow Urgence
1. **Urgence détectée** → Création `emergency_assignment`
2. **Communication multi-canal** → Email + SMS + Push au client
3. **Recherche backup** → Notification pool prestataires
4. **Attribution** → SMS mission urgente au prestataire
5. **Escalade si besoin** → Notification tous les admins

## 📈 Métriques Clés

### KPIs Business
- Taux de réservation : `bookings / visites`
- Taux de complétion : `completed / total bookings`
- Note moyenne plateforme : `AVG(reviews.rating)`
- Temps de résolution urgences : `AVG(resolved_at - created_at)`

### KPIs Techniques
- Temps de réponse API : < 500ms
- Disponibilité : > 99.9%
- Taux d'erreur : < 0.1%

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Supabase
supabase functions deploy send-critical-sms
supabase functions deploy send-transactional-email
supabase db reset # Reset base de données locale
```

## 🚦 Roadmap

### Phase 1 ✅ (Complétée)
- [x] Système de réservation
- [x] Communication multi-canal
- [x] Gestion urgences
- [x] Analytics avancés
- [x] Dashboard financier

### Phase 2 (À venir)
- [ ] Application mobile React Native
- [ ] Paiements Stripe intégrés
- [ ] Système de fidélité clients
- [ ] IA pour matching prestataires
- [ ] Chat en temps réel

### Phase 3 (Futur)
- [ ] Marketplace services
- [ ] API publique
- [ ] White-label pour entreprises
- [ ] Expansion internationale

## 📞 Support

### Documentation
- Supabase : https://supabase.com/docs
- shadcn/ui : https://ui.shadcn.com
- Recharts : https://recharts.org

### Contact
- Email : support@bikawo.com
- Discord : [Lien Discord]
- GitHub : [Lien Repo]

## 📝 Changelog

### v1.0.0 (Janvier 2025)
- 🎉 Lancement initial
- ✨ Toutes les fonctionnalités Phase 1

---

**Fait avec ❤️ par l'équipe Bikawo**
