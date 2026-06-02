/**
 * Service Layer — Bookings
 * 
 * Centralise tous les accès Supabase liés aux bookings.
 * - Gestion d'erreurs uniforme
 * - Retry automatique sur erreurs réseau
 * - Logs structurés
 * - Types stricts
 * 
 * Utilisation : via les hooks React Query dans src/hooks/queries/useBookings.ts
 * Ne pas appeler directement depuis les composants UI.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";

export interface BookingFilters {
  clientId?: string;
  providerId?: string;
  status?: BookingStatus | BookingStatus[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface BookingWithRelations extends Booking {
  service?: { id: string; name: string; category: string | null } | null;
  provider?: { id: string; business_name: string | null } | null;
}

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "BookingServiceError";
  }
}

/** Retry helper pour erreurs réseau transitoires */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Ne retry que sur erreurs réseau / 5xx
      const isRetryable = err?.message?.includes("network") || err?.code === "PGRST301" || (err?.status >= 500 && err?.status < 600);
      if (!isRetryable || i === retries) break;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

export const bookingService = {
  /** Liste des bookings avec filtres optionnels */
  async list(filters: BookingFilters = {}): Promise<BookingWithRelations[]> {
    return withRetry(async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          service:services(id, name, category),
          provider:providers(id, business_name)
        `)
        .order("booking_date", { ascending: false });

      if (filters.clientId) query = query.eq("client_id", filters.clientId);
      if (filters.providerId) query = query.eq("provider_id", filters.providerId);
      if (filters.status) {
        query = Array.isArray(filters.status)
          ? query.in("status", filters.status)
          : query.eq("status", filters.status);
      }
      if (filters.fromDate) query = query.gte("booking_date", filters.fromDate);
      if (filters.toDate) query = query.lte("booking_date", filters.toDate);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw new ServiceError("Erreur lors du chargement des réservations", error.code, error);
      return (data ?? []) as unknown as BookingWithRelations[];
    });
  },

  /** Récupère un booking par ID */
  async getById(id: string): Promise<BookingWithRelations | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services(id, name, category),
          provider:providers(id, business_name)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ServiceError("Réservation introuvable", error.code, error);
      return data as unknown as BookingWithRelations | null;
    });
  },

  /** Création d'un booking */
  async create(payload: BookingInsert): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select()
      .single();
    if (error) throw new ServiceError("Impossible de créer la réservation", error.code, error);
    return data;
  },

  /** Mise à jour d'un booking */
  async update(id: string, patch: BookingUpdate): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ServiceError("Impossible de mettre à jour la réservation", error.code, error);
    return data;
  },

  /** Changement de statut (raccourci) */
  async updateStatus(id: string, status: BookingStatus, extra?: BookingUpdate): Promise<Booking> {
    return this.update(id, { status, ...extra });
  },

  /** Annulation */
  async cancel(id: string, reason: string, cancelledBy: string): Promise<Booking> {
    return this.update(id, {
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
    });
  },
};

export { ServiceError as BookingServiceError };
