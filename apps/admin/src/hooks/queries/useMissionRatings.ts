/**
 * Hook React Query — Mission Ratings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionRatingService, type MissionRatingInsert, type MissionRatingUpdate } from "@/services/missionRatingService";

export const ratingKeys = {
  all: ["mission-ratings"] as const,
  forBooking: (bookingId: string, clientId: string) =>
    [...ratingKeys.all, "booking", bookingId, clientId] as const,
  forProvider: (providerId: string) => [...ratingKeys.all, "provider", providerId] as const,
  average: (providerId: string) => [...ratingKeys.all, "avg", providerId] as const,
};

export const useBookingRating = (bookingId: string | undefined, clientId: string | undefined) => {
  return useQuery({
    queryKey: ratingKeys.forBooking(bookingId ?? "", clientId ?? ""),
    queryFn: () => missionRatingService.getForBooking(bookingId!, clientId!),
    enabled: !!bookingId && !!clientId,
    staleTime: 60 * 1000,
  });
};

export const useProviderRatings = (providerId: string | undefined, limit = 50) => {
  return useQuery({
    queryKey: ratingKeys.forProvider(providerId ?? ""),
    queryFn: () => missionRatingService.listForProvider(providerId!, limit),
    enabled: !!providerId,
    staleTime: 60 * 1000,
  });
};

export const useProviderAverageRating = (providerId: string | undefined) => {
  return useQuery({
    queryKey: ratingKeys.average(providerId ?? ""),
    queryFn: () => missionRatingService.averageForProvider(providerId!),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRating = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MissionRatingInsert) => missionRatingService.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ratingKeys.forBooking(data.booking_id, data.client_id) });
      qc.invalidateQueries({ queryKey: ratingKeys.forProvider(data.provider_id) });
      qc.invalidateQueries({ queryKey: ratingKeys.average(data.provider_id) });
    },
  });
};

export const useUpdateRating = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MissionRatingUpdate }) =>
      missionRatingService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ratingKeys.all });
    },
  });
};
