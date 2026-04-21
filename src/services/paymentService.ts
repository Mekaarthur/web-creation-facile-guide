/**
 * Service Layer — Payments
 *
 * Centralise les accès aux paiements Stripe + transactions enregistrées en base.
 * Utilisation via src/hooks/queries/usePayments.ts uniquement.
 *
 * Les actions Stripe (création session, refund, transfer) passent par les
 * edge functions existantes (`create-payment`, `process-refund`, etc.).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "cancelled";

export interface PaymentFilters {
  clientId?: string;
  bookingId?: string;
  status?: PaymentStatus | PaymentStatus[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "PaymentServiceError";
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

export const paymentService = {
  async list(filters: PaymentFilters = {}): Promise<Payment[]> {
    return withRetry(async () => {
      let query = supabase.from("payments").select("*").order("created_at", { ascending: false });

      if (filters.clientId) query = query.eq("client_id", filters.clientId);
      if (filters.bookingId) query = query.eq("booking_id", filters.bookingId);
      if (filters.status) {
        query = Array.isArray(filters.status)
          ? query.in("status", filters.status)
          : query.eq("status", filters.status);
      }
      if (filters.fromDate) query = query.gte("created_at", filters.fromDate);
      if (filters.toDate) query = query.lte("created_at", filters.toDate);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw new ServiceError("Erreur lors du chargement des paiements", error.code, error);
      return data ?? [];
    });
  },

  async getById(id: string): Promise<Payment | null> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
      if (error) throw new ServiceError("Paiement introuvable", error.code, error);
      return data;
    });
  },

  /** Crée une session Stripe Checkout via l'edge function `create-payment`. */
  async createCheckoutSession(payload: {
    bookingId?: string;
    cartId?: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }> {
    const { data, error } = await supabase.functions.invoke("create-payment", { body: payload });
    if (error) throw new ServiceError("Impossible de créer le paiement", undefined, error);
    if (!data?.url) throw new ServiceError("Réponse Stripe invalide");
    return { url: data.url, sessionId: data.sessionId ?? data.session_id };
  },

  /** Lance un remboursement via l'edge function `process-refund`. */
  async refund(paymentId: string, amount?: number, reason?: string): Promise<{ success: boolean }> {
    const { data, error } = await supabase.functions.invoke("process-refund", {
      body: { paymentId, amount, reason },
    });
    if (error) throw new ServiceError("Remboursement échoué", undefined, error);
    return data;
  },

  /** Vérifie l'état d'un paiement Stripe via `verify-payment`. */
  async verify(sessionId: string): Promise<{ status: string; payment?: Payment }> {
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { session_id: sessionId },
    });
    if (error) throw new ServiceError("Vérification du paiement impossible", undefined, error);
    return data;
  },
};

export { ServiceError as PaymentServiceError };
