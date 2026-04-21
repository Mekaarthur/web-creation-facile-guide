/**
 * Hook React Query — Payments
 * Wrapper autour de paymentService (lecture + actions Stripe via edge functions).
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { paymentService, type Payment, type PaymentFilters, type PaymentStatus } from "@/services/paymentService";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

export const usePayments = (
  filters: PaymentFilters = {},
  options?: Omit<UseQueryOptions<Payment[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentService.list(filters),
    staleTime: 30 * 1000,
    ...options,
  });
};

export const usePayment = (id: string | undefined) => {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ""),
    queryFn: () => paymentService.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: (payload: Parameters<typeof paymentService.createCheckoutSession>[0]) =>
      paymentService.createCheckoutSession(payload),
  });
};

export const useRefundPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, amount, reason }: { paymentId: string; amount?: number; reason?: string }) =>
      paymentService.refund(paymentId, amount, reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: paymentKeys.detail(vars.paymentId) });
      qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: (sessionId: string) => paymentService.verify(sessionId),
  });
};

export type { Payment, PaymentFilters, PaymentStatus };
