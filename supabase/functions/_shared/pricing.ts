// Tarifs officiels Bikawô — centimes (fallback si la DB est indisponible)
export const PRICING = {
  bika_maison:   { client: 2500, provider: 1800 },
  bika_kids:     { client: 2500, provider: 1800 },
  bika_vie:      { client: 2500, provider: 1800 },
  bika_animals:  { client: 2500, provider: 1800 },
  bika_menage:   { client: 2800, provider: 2100 },
  bika_seniors:  { client: 3000, provider: 2200 },
  bika_travel:   { client: 3000, provider: 2200 },
  bika_pro:      { client: 4000, provider: 2900 },
  bika_plus:     { client: 3500, provider: 2500 },
} as const;

export type ServiceType = keyof typeof PRICING;

// Stripe : 1,4 % + 25 centimes par transaction
export function calculateStripeCommission(amountCents: number): number {
  return Math.round(amountCents * 0.014) + 25;
}

export function calculateMissionSplit(
  serviceType: ServiceType,
  hours: number,
  overrideClient?: number,   // centimes — override DB
  overrideProvider?: number  // centimes — override DB
) {
  const base = PRICING[serviceType];
  const clientCents   = overrideClient   ?? base.client;
  const providerCents = overrideProvider ?? base.provider;

  const totalAmount    = clientCents * hours;
  const providerAmount = providerCents * hours;
  const stripeComm     = calculateStripeCommission(totalAmount);
  const bikawoNet      = totalAmount - providerAmount - stripeComm;

  return {
    totalAmount,
    providerAmount,
    stripeComm,
    bikawoNet,
    bikawoPercentage: Math.round((bikawoNet / totalAmount) * 100),
  };
}

// Avance immédiate URSSAF : client paie 50 %, URSSAF rembourse 50 %
export function calculateWithAvanceImmediate(
  serviceType: ServiceType,
  hours: number,
  overrideClient?: number,
  overrideProvider?: number
) {
  const base = calculateMissionSplit(serviceType, hours, overrideClient, overrideProvider);
  return {
    ...base,
    clientPaysNow: Math.round(base.totalAmount / 2),
    urssafPays:    Math.round(base.totalAmount / 2),
  };
}

/**
 * Charge les prix depuis financial_rules (source de vérité DB).
 * Retourne null si la table est vide ou inaccessible (l'appelant utilise PRICING en fallback).
 */
export async function loadDynamicPricing(
  supabase: any
): Promise<Record<string, { client: number; provider: number }> | null> {
  try {
    const { data, error } = await supabase
      .from("financial_rules")
      .select("service_category, client_price, provider_payment, is_active")
      .eq("is_active", true);

    if (error || !data || data.length === 0) return null;

    const map: Record<string, { client: number; provider: number }> = {};
    for (const row of data) {
      // Convertir € → centimes
      map[row.service_category] = {
        client:   Math.round(parseFloat(row.client_price)   * 100),
        provider: Math.round(parseFloat(row.provider_payment) * 100),
      };
    }
    return map;
  } catch {
    return null;
  }
}
