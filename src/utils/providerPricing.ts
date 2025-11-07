/**
 * Calculateur de revenus prestataire basé sur le prix client
 * Tarifs fixes selon la grille Bikawo
 */

export const calculateProviderEarnings = (clientPrice: number): number => {
  // Règle de calcul fixe Bikawo
  if (clientPrice === 25) {
    return 18;
  } else if (clientPrice === 30) {
    return 22;
  }
  
  // Fallback pour d'autres tarifs (28% de commission)
  return Math.round(clientPrice * 0.72 * 100) / 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export interface UniverseCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const UNIVERSE_CATEGORIES: UniverseCategory[] = [
  {
    id: 'bika_kids',
    name: 'BIKA KIDS',
    shortName: 'Kids',
    description: 'Garde d\'enfants et activités éducatives',
    icon: '🧒',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50'
  },
  {
    id: 'bika_maison',
    name: 'BIKA MAISON',
    shortName: 'Maison',
    description: 'Entretien et gestion du foyer',
    icon: '🏠',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'bika_vie',
    name: 'BIKA VIE',
    shortName: 'Vie',
    description: 'Conciergerie et assistance quotidienne',
    icon: '🔑',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'bika_travel',
    name: 'BIKA TRAVEL',
    shortName: 'Travel',
    description: 'Organisation de voyages et accompagnement',
    icon: '✈️',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'bika_seniors',
    name: 'BIKA SENIORS',
    shortName: 'Seniors',
    description: 'Accompagnement des personnes âgées',
    icon: '👴',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'bika_animals',
    name: 'BIKA ANIMALS',
    shortName: 'Animals',
    description: 'Soins et garde d\'animaux',
    icon: '🐾',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'bika_pro',
    name: 'BIKA PRO',
    shortName: 'Pro',
    description: 'Services aux entreprises',
    icon: '💼',
    color: 'from-gray-600 to-slate-600',
    bgColor: 'bg-gray-50'
  },
  {
    id: 'bika_plus',
    name: 'BIKA PLUS',
    shortName: 'Plus',
    description: 'Services premium et conciergerie de luxe',
    icon: '💎',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50'
  }
];
