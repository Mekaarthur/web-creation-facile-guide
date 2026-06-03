/**
 * useAdminKpis — KPIs admin temps réel (Chantier 6)
 *
 * Centralise les indicateurs business clés :
 *   - CA total + commissions plateforme (financial_transactions)
 *   - Volume bookings (status breakdown)
 *   - Taux de conversion panier → commande
 *   - Top services & top prestataires
 *
 * Refresh automatique toutes les 30s.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type KpiPeriod = "7d" | "30d" | "90d" | "365d";

export interface AdminKpis {
  period: KpiPeriod;
  range: { start: string; end: string };
  revenue: {
    total: number;
    commission: number;
    providerPayout: number;
    transactionCount: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    inProgress: number;
  };
  conversion: {
    cartsCreated: number;
    cartsConverted: number;
    rate: number; // 0..1
  };
  topServices: Array<{ service_id: string; name: string; count: number; revenue: number }>;
  topProviders: Array<{ provider_id: string; name: string; missions: number; revenue: number }>;
}

const periodToDays: Record<KpiPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

const adminKpiKeys = {
  all: ["admin-kpis"] as const,
  byPeriod: (p: KpiPeriod) => [...adminKpiKeys.all, p] as const,
};

export const useAdminKpis = (period: KpiPeriod = "30d") => {
  return useQuery<AdminKpis>({
    queryKey: adminKpiKeys.byPeriod(period),
    refetchInterval: 30_000,
    staleTime: 25_000,
    queryFn: async () => {
      const days = periodToDays[period];
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // ── Revenus ─────────────────────────────────────────────
      const { data: txs } = await supabase
        .from("financial_transactions")
        .select("client_price, company_commission, provider_payment, payment_status")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      const paidTxs = (txs ?? []).filter((t) => t.payment_status === "paid");
      const revenue = {
        total: paidTxs.reduce((s, t) => s + Number(t.client_price ?? 0), 0),
        commission: paidTxs.reduce((s, t) => s + Number(t.company_commission ?? 0), 0),
        providerPayout: paidTxs.reduce((s, t) => s + Number(t.provider_payment ?? 0), 0),
        transactionCount: paidTxs.length,
      };

      // ── Bookings ────────────────────────────────────────────
      const { data: bks } = await supabase
        .from("bookings")
        .select("id, status, total_price, service_id, provider_id, created_at")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      const allBookings = bks ?? [];
      const bookings = {
        total: allBookings.length,
        completed: allBookings.filter((b) => b.status === "completed").length,
        pending: allBookings.filter((b) => b.status === "pending").length,
        cancelled: allBookings.filter((b) => b.status === "cancelled").length,
        inProgress: allBookings.filter((b) => b.status === "in_progress").length,
      };

      // ── Conversion paniers ──────────────────────────────────
      const { count: cartsCreated } = await supabase
        .from("carts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      const { count: cartsConverted } = await supabase
        .from("carts")
        .select("id", { count: "exact", head: true })
        .eq("status", "converted")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      const conversion = {
        cartsCreated: cartsCreated ?? 0,
        cartsConverted: cartsConverted ?? 0,
        rate: cartsCreated && cartsCreated > 0 ? (cartsConverted ?? 0) / cartsCreated : 0,
      };

      // ── Top services ────────────────────────────────────────
      const serviceAgg = new Map<string, { count: number; revenue: number }>();
      for (const b of allBookings) {
        if (!b.service_id) continue;
        const cur = serviceAgg.get(b.service_id) ?? { count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += Number(b.total_price ?? 0);
        serviceAgg.set(b.service_id, cur);
      }
      const topServiceIds = [...serviceAgg.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id]) => id);

      let topServices: AdminKpis["topServices"] = [];
      if (topServiceIds.length > 0) {
        const { data: services } = await supabase
          .from("services")
          .select("id, name")
          .in("id", topServiceIds);
        topServices = topServiceIds.map((id) => {
          const agg = serviceAgg.get(id)!;
          const svc = services?.find((s) => s.id === id);
          return {
            service_id: id,
            name: svc?.name ?? "Service inconnu",
            count: agg.count,
            revenue: agg.revenue,
          };
        });
      }

      // ── Top providers ───────────────────────────────────────
      const providerAgg = new Map<string, { missions: number; revenue: number }>();
      for (const b of allBookings) {
        if (!b.provider_id) continue;
        const cur = providerAgg.get(b.provider_id) ?? { missions: 0, revenue: 0 };
        cur.missions += 1;
        cur.revenue += Number(b.total_price ?? 0);
        providerAgg.set(b.provider_id, cur);
      }
      const topProviderIds = [...providerAgg.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([id]) => id);

      let topProviders: AdminKpis["topProviders"] = [];
      if (topProviderIds.length > 0) {
        const { data: providers } = await supabase
          .from("providers")
          .select("id, business_name, user_id")
          .in("id", topProviderIds);

        const userIds = (providers ?? []).map((p) => p.user_id).filter(Boolean) as string[];
        const { data: profiles } = userIds.length
          ? await supabase
              .from("profiles")
              .select("user_id, first_name, last_name")
              .in("user_id", userIds)
          : { data: [] as any[] };

        topProviders = topProviderIds.map((id) => {
          const agg = providerAgg.get(id)!;
          const prov = providers?.find((p) => p.id === id);
          const profile = profiles?.find((pr: any) => pr.user_id === prov?.user_id);
          const name =
            profile?.first_name || profile?.last_name
              ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
              : prov?.business_name ?? "Prestataire";
          return {
            provider_id: id,
            name,
            missions: agg.missions,
            revenue: agg.revenue,
          };
        });
      }

      return {
        period,
        range: { start: startISO, end: endISO },
        revenue,
        bookings,
        conversion,
        topServices,
        topProviders,
      };
    },
  });
};
