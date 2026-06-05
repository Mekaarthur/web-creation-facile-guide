/**
 * Hook qui lit les prix depuis la table service_pricing (Supabase).
 * Fallback automatique sur les prix statiques de universeServices.ts
 * si la table ne contient pas encore de ligne pour un service donné.
 *
 * Usage :
 *   const { getPrice, getProviderPrice, isLoading } = useServicePrices();
 *   const clientPrice = getPrice('garde-enfants-babysitting', 25); // 25 = fallback
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateProviderPrice } from "@/utils/universeServices";

interface ServicePricingRow {
  service_slug: string;
  client_price: number;
}

export const useServicePrices = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["service-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_pricing" as any)
        .select("service_slug, client_price")
        .eq("is_active", true);

      if (error) throw error;
      const map: Record<string, number> = {};
      ((data || []) as unknown as ServicePricingRow[]).forEach((row) => {
        map[row.service_slug] = row.client_price;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000, // 5 min — les prix changent rarement
    gcTime: 30 * 60 * 1000,
  });

  /**
   * Retourne le prix client effectif pour un sous-service.
   * @param slug  - l'id du sous-service (ex: "garde-enfants-babysitting")
   * @param staticFallback - prix statique à utiliser si pas de surcharge DB
   */
  const getPrice = (slug: string, staticFallback: number | string): number | string => {
    if (data && data[slug] !== undefined) return data[slug];
    return staticFallback;
  };

  /**
   * Retourne le prix prestataire (72 % du prix client).
   */
  const getProviderPrice = (slug: string, staticFallback: number | string): number | string => {
    const effective = getPrice(slug, staticFallback);
    if (typeof effective === "number") return calculateProviderPrice(effective);
    return effective;
  };

  return { getPrice, getProviderPrice, isLoading, error };
};
