export interface SubService {
  id: string;
  name: string;
  clientPrice: number; // Prix payé par le client
  providerPrice: number; // Prix reçu par le prestataire (calculé automatiquement)
}

export interface UniverseCategory {
  id: string;
  name: string;
  description: string;
  subServices: SubService[];
}

// Fonction pour calculer le prix prestataire
export const calculateProviderPrice = (clientPrice: number): number => {
  if (clientPrice === 30) return 22;
  if (clientPrice === 25) return 18;
  return clientPrice * 0.72; // Par défaut, 72% du prix client
};

export const universeServices: UniverseCategory[] = [
  {
    id: 'bika_kids',
    name: 'Bika Kids',
    description: 'Garde d\'enfants et activités éducatives',
    subServices: [
      {
        id: 'garde_ponctuelle',
        name: 'Garde ponctuelle et régulière',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'garde_nuit',
        name: 'Gardes de nuit, urgences et accompagnement enfants malades',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'anniversaires',
        name: 'Organisation d\'anniversaires, animations et événements personnalisés',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'soutien_scolaire',
        name: 'Soutien scolaire et préparation aux examens',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_maison',
    name: 'Bika Maison',
    description: 'Services de préparation culinaire / batch cooking',
    subServices: [
      {
        id: 'batch_cooking',
        name: 'Batch cooking et préparation de repas',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'menage',
        name: 'Ménage et entretien du domicile',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'repassage',
        name: 'Repassage et entretien du linge',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'jardinage',
        name: 'Jardinage et entretien espaces verts',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_vie',
    name: 'Bika Vie',
    description: 'Conciergerie et assistance quotidienne',
    subServices: [
      {
        id: 'courses',
        name: 'Courses et logistique du quotidien',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'demarches',
        name: 'Accompagnement aux démarches administratives',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'rdv_medicaux',
        name: 'Accompagnement rendez-vous médicaux',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'conciergerie',
        name: 'Services de conciergerie personnalisés',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_travel',
    name: 'Bika Travel',
    description: 'Organisation de voyages et accompagnement',
    subServices: [
      {
        id: 'organisation_voyage',
        name: 'Organisation complète de voyages',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'accompagnement',
        name: 'Accompagnement durant le voyage',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'transferts',
        name: 'Transferts et transport',
        clientPrice: 25,
        providerPrice: 18
      }
    ]
  },
  {
    id: 'bika_seniors',
    name: 'Bika Seniors',
    description: 'Accompagnement des personnes âgées',
    subServices: [
      {
        id: 'compagnie',
        name: 'Compagnie et présence',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'aide_quotidienne',
        name: 'Aide aux tâches quotidiennes',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'accompagnement_medical',
        name: 'Accompagnement médical et sorties',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'activites',
        name: 'Activités et stimulation cognitive',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_animals',
    name: 'Bika Animals',
    description: 'Soins et garde d\'animaux',
    subServices: [
      {
        id: 'garde_domicile',
        name: 'Garde d\'animaux à domicile',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'promenades',
        name: 'Promenades et sorties',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'soins',
        name: 'Soins et toilettage',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'veterinaire',
        name: 'Accompagnement vétérinaire',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_pro',
    name: 'Bika Pro',
    description: 'Services aux entreprises',
    subServices: [
      {
        id: 'assistant_admin',
        name: 'Assistance administrative',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'evenements',
        name: 'Organisation d\'événements professionnels',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'conciergerie_entreprise',
        name: 'Conciergerie d\'entreprise',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_plus',
    name: 'Bika Plus',
    description: 'Services premium et conciergerie de luxe',
    subServices: [
      {
        id: 'conciergerie_luxe',
        name: 'Conciergerie de luxe',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'evenements_prestige',
        name: 'Organisation d\'événements prestige',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'services_personnalises',
        name: 'Services ultra-personnalisés',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  }
];
