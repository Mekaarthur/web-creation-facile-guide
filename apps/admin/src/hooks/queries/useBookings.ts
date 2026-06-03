/**
 * Hook React Query — Bookings
 * 
 * Wrapper autour de bookingService avec :
 * - Cache automatique (staleTime 30s)
 * - Invalidation sur mutations
 * - Optimistic updates
 * - Loading / error states unifiés
 * 
 * Usage dans composants :
 *   const { data: bookings, isLoading } = useBookings({ clientId });
 *   const updateStatus = useUpdateBookingStatus();
 *   updateStatus.mutate({ id, status: "confirmed" });
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { bookingService, type BookingFilters, type BookingStatus, type BookingWithRelations, type BookingInsert, type BookingUpdate, type Booking } from "@/services/bookingService";

/** Clés de cache centralisées */
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

/** Liste des bookings avec filtres */
export const useBookings = (
  filters: BookingFilters = {},
  options?: Omit<UseQueryOptions<BookingWithRelations[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => bookingService.list(filters),
    staleTime: 30 * 1000,
    ...options,
  });
};

/** Détail d'un booking */
export const useBooking = (id: string | undefined, options?: Omit<UseQueryOptions<BookingWithRelations | null>, "queryKey" | "queryFn">) => {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ""),
    queryFn: () => bookingService.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
};

/** Création */
export const useCreateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingInsert) => bookingService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
};

/** Mise à jour générique */
export const useUpdateBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BookingUpdate }) =>
      bookingService.update(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
};

/** Changement de statut avec optimistic update */
export const useUpdateBookingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: BookingStatus; extra?: BookingUpdate }) =>
      bookingService.updateStatus(id, status, extra),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: bookingKeys.detail(id) });
      const previous = qc.getQueryData<BookingWithRelations>(bookingKeys.detail(id));
      if (previous) {
        qc.setQueryData<BookingWithRelations>(bookingKeys.detail(id), { ...previous, status });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(bookingKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
};

/** Annulation */
export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, cancelledBy }: { id: string; reason: string; cancelledBy: string }) =>
      bookingService.cancel(id, reason, cancelledBy),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
};

export type { Booking, BookingWithRelations, BookingFilters, BookingStatus };
