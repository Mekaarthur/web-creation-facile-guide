/**
 * Service Layer — Recurring Bookings (R-SEL-18)
 *
 * Stocke la préférence de récurrence du client. Ne génère pas automatiquement
 * les réservations futures (cron + Edge Function non couverts ici).
 */

import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";

export type RecurringBooking = Database["public"]["Tables"]["recurring_bookings"]["Row"];
export type RecurringBookingInsert = Database["public"]["Tables"]["recurring_bookings"]["Insert"];
export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

const NOTICE_PERIOD_DAYS = 7;

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "RecurringBookingServiceError";
  }
}

function nextOccurrenceDate(startDate: string, frequency: RecurringFrequency): Date {
  const start = new Date(startDate);
  const now = new Date();
  if (start > now) return start;

  const stepDays = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const elapsedDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const cyclesPassed = Math.ceil(elapsedDays / stepDays);
  return new Date(start.getTime() + cyclesPassed * stepDays * 86_400_000);
}

export const recurringBookingService = {
  /** R-SEL-18: liste des récurrences actives du client */
  async listForClient(clientId: string): Promise<RecurringBooking[]> {
    const { data, error } = await supabase
      .from("recurring_bookings")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw new ServiceError("Erreur lors du chargement des récurrences", error.code, error);
    return data ?? [];
  },

  /** R-SEL-18: nombre de réservations passées du client, utilisé pour la réduction fidélité (-5% à partir de la 3e) */
  async getCompletedBookingsCount(clientId: string): Promise<number> {
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["completed", "confirmed", "booking_confirmed", "in_progress"]);
    if (error) throw new ServiceError("Erreur lors du calcul de l'historique client", error.code, error);
    return count ?? 0;
  },

  /** R-SEL-18: active une récurrence après la 1ère réservation */
  async create(payload: RecurringBookingInsert): Promise<RecurringBooking> {
    const { data, error } = await supabase
      .from("recurring_bookings")
      .insert(payload)
      .select()
      .single();
    if (error) throw new ServiceError("Impossible d'activer la récurrence", error.code, error);
    return data;
  },

  /** R-SEL-18: annulation sans frais si demandée au moins 7 jours avant la prochaine occurrence */
  async cancel(id: string, startDate: string, frequency: RecurringFrequency, reason?: string): Promise<{ booking: RecurringBooking; freeOfCharge: boolean }> {
    const next = nextOccurrenceDate(startDate, frequency);
    const noticeDays = (next.getTime() - Date.now()) / 86_400_000;
    const freeOfCharge = noticeDays >= NOTICE_PERIOD_DAYS;

    const { data, error } = await supabase
      .from("recurring_bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ServiceError("Impossible d'annuler la récurrence", error.code, error);
    return { booking: data, freeOfCharge };
  },
};

export { ServiceError as RecurringBookingServiceError };
