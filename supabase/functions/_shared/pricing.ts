// Tarifs officiels Bikawô — en centimes (1 centime = 0,01 €)
export const PRICING = {
  bika_maison:   { client: 2500, provider: 1800 },
  bika_kids:     { client: 2500, provider: 1800 },
  bika_vie:      { client: 2500, provider: 1800 },
  bika_animals:  { client: 2500, provider: 1800 },
  bika_menage:   { client: 2800, provider: 2100 },
  bika_seniors:  { client: 3000, provider: 2200 },
  bika_travel:   { client: 3000, provider: 2200 },
  bika_pro:      { client: 4000, provider: 2900 },
} as const;

export type ServiceType = keyof typeof PRICING;

// Stripe : 1,4 % + 25 centimes par transaction
export function calculateStripeCommission(amountCents: number): number {
  return Math.round(amountCents * 0.014) + 25;
}

export function calculateMissionSplit(serviceType: ServiceType, hours: number) {
  const pricing        = PRICING[serviceType];
  const totalAmount    = pricing.client * hours;            // centimes
  const providerAmount = pricing.provider * hours;          // centimes
  const stripeComm     = calculateStripeCommission(totalAmount);
  const bikawoNet      = totalAmount - providerAmount - stripeComm;

  return {
    totalAmount,       // Ce que le client paie (centimes)
    providerAmount,    // Ce que reçoit le prestataire (centimes)
    stripeComm,        // Commission Stripe retenue (centimes)
    bikawoNet,         // Marge nette Bikawô (centimes)
    bikawoPercentage:  Math.round((bikawoNet / totalAmount) * 100),
  };
}

// Avance immédiate URSSAF : client paie 50 %, URSSAF rembourse 50 %
export function calculateWithAvanceImmediate(serviceType: ServiceType, hours: number) {
  const base = calculateMissionSplit(serviceType, hours);
  return {
    ...base,
    clientPaysNow: Math.round(base.totalAmount / 2),
    urssafPays:    Math.round(base.totalAmount / 2),
  };
}
