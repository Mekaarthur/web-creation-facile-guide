/**
 * Service Layer — Providers
 *
 * Centralise les accès Supabase liés aux prestataires.
 * Utilisation via src/hooks/queries/useProviders.ts uniquement.
 */

import { supabase } from "../integrations/supabase/client";
import { sanitizeSearch } from "../lib/sanitizeSearch";
import type { Database } from "../integrations/supabase/types";

export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderInsert = Database["public"]["Tables"]["providers"]["Insert"];
export type ProviderUpdate = Database["public"]["Tables"]["providers"]["Update"];

export type ProviderStatus = "pending" | "active" | "suspended" | "rejected";

export interface ProviderFilters {
  status?: ProviderStatus | ProviderStatus[];
  isVerified?: boolean;
  zone?: string;
  minRating?: number;
  search?: string;
  limit?: number;
}

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "ProviderServiceError";
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err: any) {
      lastError = err;
      const isRetryable = err?.message?.includes("network") || err?.code === "PGRST301" || (err?.status >= 500 && err?.status < 600);
      if (!isRetryable || i === retries) break;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

export const providerService = {
  async list(filters: ProviderFilters = {}): Promise<Provider[]> {
    return withRetry(async () => {
      let query = supabase.from("providers").select("*").order("created_at", { ascending: false });

      if (filters.status) {
        query = Array.isArray(filters.status)
          ? query.in("status", filters.status)
          : query.eq("status", filters.status);
      }
      if (filters.isVerified !== undefined) query = query.eq("is_verified", filters.isVerified);
      if (filters.minRating !== undefined) query = query.gte("rating", filters.minRating);
      if (filters.zone) query = query.contains("postal_codes", [filters.zone]);
      if (filters.search) query = query.ilike("business_name", `%${sanitizeSearch(filters.search)}%`);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw new ServiceError("Erreur lors du chargement des prestataires", error.code, error);
      return data ?? [];
    });
  },

  async getById(id: string): Promise<Provider | null> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("providers").select("*").eq("id", id).maybeSingle();
      if (error) throw new ServiceError("Prestataire introuvable", error.code, error);
      return data;
    });
  },

  async getByUserId(userId: string): Promise<Provider | null> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("providers").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw new ServiceError("Prestataire introuvable", error.code, error);
      return data;
    });
  },

  async update(id: string, patch: ProviderUpdate): Promise<Provider> {
    const { data, error } = await supabase.from("providers").update(patch).eq("id", id).select().single();
    if (error) throw new ServiceError("Mise à jour impossible", error.code, error);
    return data;
  },

  async setStatus(id: string, status: ProviderStatus): Promise<Provider> {
    return this.update(id, { status });
  },

  async setVerified(id: string, isVerified: boolean): Promise<Provider> {
    return this.update(id, { is_verified: isVerified });
  },

  async getDashboardProfile(userId: string): Promise<any | null> {
    return withRetry(async () => {
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select(`
          *,
          provider_services(
            service_id,
            price_override,
            services(name, category, price_per_hour)
          )
        `)
        .eq("user_id", userId)
        .maybeSingle();

      if (providerError) throw new ServiceError("Profil prestataire introuvable", providerError.code, providerError);
      if (!providerData) return null;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      return { ...providerData, profiles: profileData || null };
    });
  },

  async getMissions(providerId: string): Promise<any[]> {
    return withRetry(async () => {
      const { data: missionsData, error } = await supabase
        .from("bookings")
        .select(`
          id, booking_date, start_time, end_time, status, address,
          notes, provider_notes, client_id,
          services(name, category)
        `)
        .eq("provider_id", providerId)
        .gte("booking_date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("booking_date", { ascending: false })
        .limit(100);

      if (error) throw new ServiceError("Erreur chargement missions", error.code, error);

      const missions = missionsData || [];
      if (missions.length === 0) return [];

      // Fetch client profiles (first_name, last_name, avatar_url, phone)
      const clientIds = [...new Set(missions.map((m: any) => m.client_id).filter(Boolean))];
      const profilesMap: Record<string, any> = {};
      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url, phone")
          .in("user_id", clientIds);
        (clientProfiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      }

      // Fetch provider_payment from financial_transactions (R-PROV-01)
      const bookingIds = missions.map((m: any) => m.id);
      const { data: ftData } = await supabase
        .from("financial_transactions")
        .select("booking_id, id, provider_payment")
        .in("booking_id", bookingIds);
      const ftMap: Record<string, { id: string; provider_payment: number }> = {};
      (ftData || []).forEach((ft: any) => { ftMap[ft.booking_id] = { id: ft.id, provider_payment: ft.provider_payment }; });

      return missions.map((m: any) => ({
        ...m,
        profiles: profilesMap[m.client_id] || null,
        provider_payment: ftMap[m.id]?.provider_payment ?? null,
        financial_transaction_id: ftMap[m.id]?.id ?? null,
      }));
    });
  },

  async getOpportunities(providerId: string): Promise<any[]> {
    return withRetry(async () => {
      const { data: providerData } = await supabase
        .from("providers")
        .select("location, provider_services(service_id)")
        .eq("id", providerId)
        .maybeSingle();

      const serviceIds = providerData?.provider_services?.map((ps: any) => ps.service_id) || [];
      if (serviceIds.length === 0) return [];

      const today = new Date().toISOString().split("T")[0];

      const [openBookingsRes, matchedMissionsRes, candidaturesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(`id, booking_date, start_time, address, total_price, service_id, services(name, category)`)
          .is("provider_id", null)
          .eq("status", "pending")
          .gte("booking_date", today)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("missions")
          .select(`
            id, client_request_id, match_score, priority, assigned_at, expires_at,
            client_requests(service_type, location, preferred_date, preferred_time, budget_range)
          `)
          .eq("assigned_provider_id", providerId)
          .eq("status", "pending")
          .order("priority", { ascending: true })
          .limit(10),
        supabase
          .from("candidatures_prestataires")
          .select("mission_assignment_id")
          .eq("provider_id", providerId),
      ]);

      const appliedIds = new Set((candidaturesRes.data || []).map((c: any) => c.mission_assignment_id));

      const bookingOpportunities = (openBookingsRes.data || [])
        .filter((o: any) => serviceIds.includes(o.service_id) && !appliedIds.has(o.id))
        .map((o: any) => ({ ...o, source: "booking" as const }));

      const missionOpportunities = (matchedMissionsRes.data || [])
        .filter((m: any) => !appliedIds.has(m.id))
        .map((m: any) => ({
          id: m.id,
          booking_date: m.client_requests?.preferred_date || new Date().toISOString().split("T")[0],
          start_time: m.client_requests?.preferred_time || "09:00",
          address: m.client_requests?.location || "",
          total_price: parseFloat(m.client_requests?.budget_range) || 0,
          service_id: null,
          services: { name: m.client_requests?.service_type || "Mission", category: "matching" },
          match_score: m.match_score,
          priority: m.priority,
          source: "matching" as const,
        }));

      return [...missionOpportunities, ...bookingOpportunities];
    });
  },

  async getReviews(providerId: string, limit = 20): Promise<any[]> {
    return withRetry(async () => {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, client_id")
        .eq("provider_id", providerId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new ServiceError("Erreur chargement avis", error.code, error);

      const clientIds = [...new Set((reviewsData || []).map((r: any) => r.client_id).filter(Boolean))];
      if (clientIds.length === 0) return reviewsData || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", clientIds);

      const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      return (reviewsData || []).map((r: any) => ({
        ...r,
        profiles: profilesMap[r.client_id] || null,
      }));
    });
  },

  async getEarnings(providerId: string): Promise<{
    monthlyEarnings: number;
    previousMonthEarnings: number;
    totalEarnings: number;
    earningsGrowth: number;
  }> {
    return withRetry(async () => {
      const now = new Date();
      const cm = now.getMonth();
      const cy = now.getFullYear();
      const pm = cm === 0 ? 11 : cm - 1;
      const py = cm === 0 ? cy - 1 : cy;

      const startOfMonth = `${cy}-${String(cm + 1).padStart(2, "0")}-01`;
      const startOfPrevMonth = `${py}-${String(pm + 1).padStart(2, "0")}-01`;
      const endOfPrevMonth = startOfMonth;

      const [currentRes, prevRes, totalRes] = await Promise.all([
        supabase.from("financial_transactions")
          .select("provider_payment")
          .eq("provider_id", providerId)
          .eq("payment_status", "completed")
          .gte("created_at", startOfMonth),
        supabase.from("financial_transactions")
          .select("provider_payment")
          .eq("provider_id", providerId)
          .eq("payment_status", "completed")
          .gte("created_at", startOfPrevMonth)
          .lt("created_at", endOfPrevMonth),
        supabase.from("financial_transactions")
          .select("provider_payment")
          .eq("provider_id", providerId)
          .eq("payment_status", "completed"),
      ]);

      const sum = (rows: any[]) => (rows || []).reduce((s, t) => s + (t.provider_payment || 0), 0);
      const monthlyEarnings = sum(currentRes.data || []);
      const previousMonthEarnings = sum(prevRes.data || []);
      const totalEarnings = sum(totalRes.data || []);
      const earningsGrowth = previousMonthEarnings > 0
        ? Math.round(((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) * 100)
        : monthlyEarnings > 0 ? 100 : 0;

      return { monthlyEarnings, previousMonthEarnings, totalEarnings, earningsGrowth };
    });
  },

  async applyToOpportunity(params: {
    providerId: string;
    opportunityId: string;
    responseType?: "accepted" | "declined" | "interested";
  }): Promise<void> {
    const { providerId, opportunityId, responseType = "accepted" } = params;
    const { error } = await supabase.from("candidatures_prestataires").insert({
      provider_id: providerId,
      mission_assignment_id: opportunityId,
      response_type: responseType,
    });
    if (error) throw new ServiceError("Candidature impossible", error.code, error);
  },

  async submitApplication(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    category: string;
    experience_years: number;
    availability: string;
    motivation: string;
    has_transport: boolean;
    certifications: string;
    cv_file_url: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("job_applications").insert({
      ...payload,
      status: "pending",
    });
    if (error) throw new ServiceError("Erreur lors de la soumission de la candidature", error.code, error);
  },
};

export { ServiceError as ProviderServiceError };
