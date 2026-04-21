/**
 * Service Layer — Providers
 *
 * Centralise les accès Supabase liés aux prestataires.
 * Utilisation via src/hooks/queries/useProviders.ts uniquement.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderInsert = Database["public"]["Tables"]["providers"]["Insert"];
export type ProviderUpdate = Database["public"]["Tables"]["providers"]["Update"];

export type ProviderStatus = "pending" | "active" | "suspended" | "rejected";

export interface ProviderFilters {
  status?: ProviderStatus | ProviderStatus[];
  isVerified?: boolean;
  zone?: string;          // code postal ou zone
  minRating?: number;
  search?: string;        // business_name LIKE
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
      if (filters.search) query = query.ilike("business_name", `%${filters.search}%`);
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
};

export { ServiceError as ProviderServiceError };
