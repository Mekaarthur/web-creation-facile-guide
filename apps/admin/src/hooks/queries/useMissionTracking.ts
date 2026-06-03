/**
 * Hook React Query — Mission Tracking
 *
 * Charge les données de suivi d'une mission (booking + prestataire + service)
 * et s'abonne aux mises à jour temps réel via Supabase Realtime.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MissionTrackingData {
  id: string;
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  assigned_at: string | null;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  address: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  provider_notes: string | null;
  client_id: string;
  provider_id: string | null;
  service: { name: string } | null;
  provider: {
    business_name: string;
    profile: { first_name: string | null; last_name: string | null } | null;
  } | null;
}

export const trackingKeys = {
  all: ["mission-tracking"] as const,
  detail: (bookingId: string) => [...trackingKeys.all, bookingId] as const,
};

const fetchMissionTracking = async (bookingId: string): Promise<MissionTrackingData | null> => {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, services(name)")
    .eq("id", bookingId)
    .single();

  if (error) throw error;
  if (!booking) return null;

  let provider: MissionTrackingData["provider"] = null;

  if (booking.provider_id) {
    const { data: providerData } = await supabase
      .from("providers")
      .select("business_name, user_id")
      .eq("id", booking.provider_id)
      .single();

    if (providerData) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", providerData.user_id)
        .single();

      provider = {
        business_name: providerData.business_name,
        profile: profileData ?? null,
      };
    }
  }

  return {
    id: booking.id,
    status: booking.status,
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    assigned_at: booking.assigned_at,
    confirmed_at: booking.confirmed_at,
    started_at: booking.started_at,
    completed_at: booking.completed_at,
    address: booking.address,
    check_in_location: booking.check_in_location,
    check_out_location: booking.check_out_location,
    provider_notes: booking.provider_notes,
    client_id: booking.client_id,
    provider_id: booking.provider_id,
    service: (booking as { services?: { name: string } | null }).services ?? null,
    provider,
  };
};

export const useMissionTracking = (bookingId: string | undefined) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: trackingKeys.detail(bookingId ?? ""),
    queryFn: () => fetchMissionTracking(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });

  // Realtime — invalide le cache quand la réservation change
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`mission-tracking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: trackingKeys.detail(bookingId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);

  return query;
};
