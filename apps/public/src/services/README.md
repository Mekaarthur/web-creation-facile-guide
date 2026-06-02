# Service Layer — Architecture

Couche d'abstraction entre les composants UI et Supabase.

## Pattern

```
Composant React
    ↓
Hook React Query (src/hooks/queries/*)   ← cache, loading, mutations
    ↓
Service (src/services/*)                  ← logique métier, retry, erreurs
    ↓
Supabase Client / Edge Functions
```

## Règles

- ✅ Les composants n'importent **jamais** `supabase` directement (sauf auth)
- ✅ Les services exposent des fonctions pures asynchrones, pas de hooks
- ✅ Les hooks dans `src/hooks/queries/` wrappent les services avec React Query
- ✅ Toute mutation invalide les bonnes `queryKey`
- ❌ Ne pas mélanger React Query et `useState/useEffect` pour les mêmes données

## Services disponibles

| Service                    | Hook                  | Statut          | Notes |
|----------------------------|-----------------------|-----------------|-------|
| `bookingService`           | `useBookings`         | ✅ Disponible   | CRUD + optimistic updates |
| `providerService`          | `useProviders` + `useProviderDashboardV2` | ✅ Disponible | Admin (list/filtres) + Dashboard prestataire (profile, missions, opportunities, earnings, reviews) |
| `paymentService`           | `usePayments`         | ✅ Disponible   | Stripe via edge functions |
| `notificationServiceV2`    | `useNotificationsV2`  | ✅ Disponible   | Hub multi-canal (push/email/sms) |
| `anomalyService`           | `useAnomalies`        | ✅ Disponible   | Centre unifié, refresh 30s |
| `urssafService`            | `useUrssaf`           | 🕒 À venir      | NeedMe + API URSSAF |

## Compatibilité — anciens hooks

Les hooks suivants restent opérationnels et utilisés par les composants existants :
- `src/hooks/useNotifications.tsx` → équivalent V2 : `useNotificationsV2`
- `src/hooks/useAnomaliesCenter.tsx` → équivalent V2 : `useAnomalies`

Migration progressive composant par composant. **Pas de rupture immédiate.**

## Hub Notifications — schéma

```
                    notificationServiceV2.send()
                              ↓
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
       table notifications  edge function   edge function
       (in-app + badge)   send-modern-     send-critical-sms
                          notification     (priority=critical)
                          (push + email)
                              ↓
                          Resend / Push API
```

## Exemple d'usage

### Bookings (POC)
```tsx
import { useBookings, useUpdateBookingStatus } from "@/hooks/queries/useBookings";

const { data: bookings, isLoading } = useBookings({ clientId, status: "confirmed" });
const updateStatus = useUpdateBookingStatus();
updateStatus.mutate({ id: booking.id, status: "completed" });
```

### Providers
```tsx
import { useProviders, useSetProviderStatus } from "@/hooks/queries/useProviders";

const { data: providers } = useProviders({ status: "pending", isVerified: false });
const setStatus = useSetProviderStatus();
setStatus.mutate({ id: provider.id, status: "active" });
```

### Payments + Stripe
```tsx
import { useCreateCheckoutSession } from "@/hooks/queries/usePayments";

const checkout = useCreateCheckoutSession();
const { url } = await checkout.mutateAsync({ bookingId, amount: 12000 });
window.location.href = url;
```

### Notifications (hub unifié)
```tsx
import { useSendNotification, useUnreadCount } from "@/hooks/queries/useNotificationsV2";

const send = useSendNotification();
send.mutate({
  target: "provider",
  userId: providerId,
  type: "mission_assigned",
  title: "Nouvelle mission",
  message: "Vous avez été assigné à une mission ce vendredi",
  channels: ["inapp", "push", "email"],
  priority: "high",
  bookingId,
});

const { data: unread } = useUnreadCount(user.id);
```

### Anomalies (admin)
```tsx
import { useAnomalies, useAnomaliesBySeverity } from "@/hooks/queries/useAnomalies";

const { data: all } = useAnomalies();
const { data: critical } = useAnomaliesBySeverity("critical");
```
