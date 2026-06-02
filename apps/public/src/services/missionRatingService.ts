/**
 * Service Layer — Mission Ratings
 *
 * Notation post-mission par le client. Une note unique par couple
 * (booking_id, client_id) — contrainte UNIQUE en base.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MissionRating = Database["public"]["Tables"]["mission_ratings"]["Row"];
export type MissionRatingInsert = Database["public"]["Tables"]["mission_ratings"]["Insert"];
export type MissionRatingUpdate = Database["public"]["Tables"]["mission_ratings"]["Update"];

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "MissionRatingServiceError";
  }
}

export const missionRatingService = {
  /** Note d'un booking par le client connecté (null si pas encore notée). */
  async getForBooking(bookingId: string, clientId: string): Promise<MissionRating | null> {
    const { data, error } = await supabase
      .from("mission_ratings")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw new ServiceError("Lecture impossible", error.code, error);
    return data;
  },

  /** Toutes les notes reçues par un prestataire. */
  async listForProvider(providerId: string, limit = 50): Promise<MissionRating[]> {
    const { data, error } = await supabase
      .from("mission_ratings")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new ServiceError("Lecture impossible", error.code, error);
    return data ?? [];
  },

  /** Création d'une note. RLS impose client_id = auth.uid(). */
  async create(payload: MissionRatingInsert): Promise<MissionRating> {
    const { data, error } = await supabase
      .from("mission_ratings")
      .insert(payload)
      .select()
      .single();
    if (error) throw new ServiceError("Notation impossible", error.code, error);
    return data;
  },

  /** Mise à jour d'une note existante. */
  async update(id: string, patch: MissionRatingUpdate): Promise<MissionRating> {
    const { data, error } = await supabase
      .from("mission_ratings")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ServiceError("Mise à jour impossible", error.code, error);
    return data;
  },

  /** Moyenne pondérée des notes d'un prestataire. */
  async averageForProvider(providerId: string): Promise<{ avg: number; count: number }> {
    const { data, error } = await supabase
      .from("mission_ratings")
      .select("overall_rating")
      .eq("provider_id", providerId);
    if (error) throw new ServiceError("Calcul impossible", error.code, error);
    const ratings = (data ?? []).map(r => r.overall_rating);
    if (!ratings.length) return { avg: 0, count: 0 };
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  },
};

export { ServiceError as MissionRatingServiceError };
