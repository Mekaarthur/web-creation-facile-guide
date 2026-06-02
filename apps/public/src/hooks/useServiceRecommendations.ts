import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Recommendation {
  id: string;
  type: "rebook" | "complement" | "discover";
  universeId: string;
  universeName: string;
  universeDescription: string;
  reason: string;
  daysSinceLastBooking?: number;
  bookingCount?: number;
  route: string;
  colorClass: string;
  bgClass: string;
  emoji: string;
}

const UNIVERSE_META: Record<string, {
  name: string;
  description: string;
  route: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  emoji: string;
}> = {
  bika_kids: {
    name: "Bika Kids",
    description: "Garde d'enfants, baby-sitting, soutien scolaire",
    route: "/bika-kids",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    emoji: "👶",
  },
  bika_maison: {
    name: "Bika Maison",
    description: "Courses, repassage, batch cooking, entretien",
    route: "/bika-maison",
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
    emoji: "🏠",
  },
  bika_vie: {
    name: "Bika Vie",
    description: "Conciergerie complète, services administratifs",
    route: "/bika-vie",
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    emoji: "✨",
  },
  bika_travel: {
    name: "Bika Travel",
    description: "Préparation voyage, formalités, assistance 24h/7j",
    route: "/bika-travel",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
    emoji: "✈️",
  },
  bika_animals: {
    name: "Bika Animal",
    description: "Soins quotidiens, garde et pension pour vos animaux",
    route: "/bika-animals",
    colorClass: "text-yellow-600",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
    emoji: "🐾",
  },
  bika_seniors: {
    name: "Bika Seniors",
    description: "Assistance quotidienne, accompagnement médical",
    route: "/bika-seniors",
    colorClass: "text-pink-600",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-200",
    emoji: "💙",
  },
  bika_pro: {
    name: "Bika Pro",
    description: "Services aux entreprises, assistance dirigeants",
    route: "/bika-pro",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
    emoji: "💼",
  },
  bika_plus: {
    name: "Bika Plus",
    description: "Services sur mesure, formules premium exclusives",
    route: "/bika-plus",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    emoji: "⭐",
  },
};

// Si le client utilise X, on lui suggère Y (compléments logiques)
const COMPLEMENTS: Record<string, string[]> = {
  bika_kids: ["bika_maison", "bika_vie"],
  bika_maison: ["bika_vie", "bika_kids"],
  bika_vie: ["bika_travel", "bika_pro"],
  bika_travel: ["bika_vie", "bika_pro"],
  bika_animals: ["bika_maison", "bika_vie"],
  bika_seniors: ["bika_maison", "bika_vie"],
  bika_pro: ["bika_travel", "bika_vie"],
  bika_plus: ["bika_pro", "bika_vie"],
};

const POPULAR_ORDER = [
  "bika_maison",
  "bika_kids",
  "bika_vie",
  "bika_travel",
  "bika_animals",
  "bika_seniors",
  "bika_pro",
  "bika_plus",
];

export const useServiceRecommendations = () => {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["service-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, status, service:services(id, name, category)")
        .eq("client_id", user!.id)
        .in("status", ["completed", "confirmed"])
        .order("booking_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const recommendations = useMemo((): Recommendation[] => {
    const now = new Date();
    const result: Recommendation[] = [];
    const addedUniverses = new Set<string>();

    // Client sans historique : univers populaires
    if (!bookings || bookings.length === 0) {
      for (const universeId of POPULAR_ORDER.slice(0, 3)) {
        const meta = UNIVERSE_META[universeId];
        if (!meta) continue;
        result.push({
          id: `discover-${universeId}`,
          type: "discover",
          universeId,
          universeName: meta.name,
          universeDescription: meta.description,
          reason: "Très populaire auprès de nos clients",
          route: meta.route,
          colorClass: meta.colorClass,
          bgClass: meta.bgClass,
          emoji: meta.emoji,
        });
      }
      return result;
    }

    // Regrouper les réservations par catégorie
    const categoryStats: Record<string, {
      count: number;
      lastDate: string;
      allDates: string[];
    }> = {};

    for (const booking of bookings) {
      const category = (booking as any).service?.category as string | undefined;
      if (!category || !UNIVERSE_META[category]) continue;

      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, lastDate: "", allDates: [] };
      }
      categoryStats[category].count++;
      categoryStats[category].allDates.push(booking.booking_date);
      if (
        !categoryStats[category].lastDate ||
        booking.booking_date > categoryStats[category].lastDate
      ) {
        categoryStats[category].lastDate = booking.booking_date;
      }
    }

    const usedUniverses = Object.keys(categoryStats);

    // --- Recommandation 1 : Re-planifier ---
    for (const [universeId, stats] of Object.entries(categoryStats)) {
      if (addedUniverses.has(universeId) || !stats.lastDate) continue;

      const daysSince = differenceInDays(now, new Date(stats.lastDate));

      // Fréquence moyenne entre réservations
      let avgFrequency = 30;
      const sorted = [...stats.allDates].sort();
      if (sorted.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const gap = differenceInDays(new Date(sorted[i]), new Date(sorted[i - 1]));
          if (gap > 0) intervals.push(gap);
        }
        if (intervals.length > 0) {
          avgFrequency = Math.max(7, intervals.reduce((a, b) => a + b, 0) / intervals.length);
        }
      }

      // Suggérer si le délai écoulé dépasse 80 % de la fréquence moyenne et < 6 mois
      if (daysSince > avgFrequency * 0.8 && daysSince < 180) {
        const meta = UNIVERSE_META[universeId];
        if (!meta) continue;

        let reason: string;
        if (daysSince < 14) {
          reason = `Dernier service il y a ${daysSince} jours`;
        } else if (daysSince < 30) {
          reason = `Cela fait ${daysSince} jours depuis votre dernier service`;
        } else {
          reason = `Votre dernier service remonte à plus d'un mois`;
        }

        result.push({
          id: `rebook-${universeId}`,
          type: "rebook",
          universeId,
          universeName: meta.name,
          universeDescription: meta.description,
          reason,
          daysSinceLastBooking: daysSince,
          bookingCount: stats.count,
          route: meta.route,
          colorClass: meta.colorClass,
          bgClass: meta.bgClass,
          emoji: meta.emoji,
        });
        addedUniverses.add(universeId);
      }
    }

    // --- Recommandation 2 : Compléments ---
    for (const usedUniverse of usedUniverses) {
      const complements = COMPLEMENTS[usedUniverse] || [];
      for (const complementId of complements) {
        if (addedUniverses.has(complementId) || usedUniverses.includes(complementId)) continue;

        const meta = UNIVERSE_META[complementId];
        const usedMeta = UNIVERSE_META[usedUniverse];
        if (!meta || !usedMeta) continue;

        result.push({
          id: `complement-${complementId}`,
          type: "complement",
          universeId: complementId,
          universeName: meta.name,
          universeDescription: meta.description,
          reason: `Idéal si vous utilisez ${usedMeta.name}`,
          route: meta.route,
          colorClass: meta.colorClass,
          bgClass: meta.bgClass,
          emoji: meta.emoji,
        });
        addedUniverses.add(complementId);
        break;
      }
    }

    // --- Recommandation 3 : Découverte ---
    for (const popularId of POPULAR_ORDER) {
      if (result.length >= 6) break;
      if (addedUniverses.has(popularId) || usedUniverses.includes(popularId)) continue;

      const meta = UNIVERSE_META[popularId];
      if (!meta) continue;

      result.push({
        id: `discover-${popularId}`,
        type: "discover",
        universeId: popularId,
        universeName: meta.name,
        universeDescription: meta.description,
        reason: "Populaire auprès de nos clients",
        route: meta.route,
        colorClass: meta.colorClass,
        bgClass: meta.bgClass,
        emoji: meta.emoji,
      });
      addedUniverses.add(popularId);
    }

    // Trier : rebook > complement > discover, max 6
    return result
      .sort((a, b) => {
        const order = { rebook: 0, complement: 1, discover: 2 };
        return order[a.type] - order[b.type];
      })
      .slice(0, 6);
  }, [bookings]);

  return { recommendations, isLoading: isLoading && !bookings };
};
