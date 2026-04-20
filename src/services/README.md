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
Supabase Client
```

## Règles

- ✅ Les composants n'importent **jamais** `supabase` directement (sauf auth)
- ✅ Les services exposent des fonctions pures asynchrones, pas de hooks
- ✅ Les hooks `useXxx` dans `src/hooks/queries/` wrappent les services
- ✅ Toute mutation invalide les bonnes `queryKey`
- ❌ Ne pas mélanger React Query et `useState/useEffect` pour les mêmes données

## Services disponibles

| Service | Hook | Statut |
|---------|------|--------|
| `bookingService` | `useBookings` | ✅ POC |
| `providerService` | `useProviders` | 🕒 À venir |
| `paymentService` | `usePayments` | 🕒 À venir |
| `notificationService` | `useNotifications` | 🕒 À venir (existant gardé) |

## Migration progressive

L'ancien hook `src/hooks/useNotifications.tsx` reste opérationnel.
Les nouveaux composants doivent utiliser la nouvelle architecture.
Migration des composants existants au cas par cas, sans rupture.

## Exemple d'usage

```tsx
import { useBookings, useUpdateBookingStatus } from "@/hooks/queries/useBookings";

function MyBookingsList({ clientId }: { clientId: string }) {
  const { data: bookings, isLoading, error } = useBookings({ clientId, status: "confirmed" });
  const updateStatus = useUpdateBookingStatus();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return bookings?.map(b => (
    <BookingCard
      key={b.id}
      booking={b}
      onCancel={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}
    />
  ));
}
```
