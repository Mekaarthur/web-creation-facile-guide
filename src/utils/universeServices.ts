export interface SubService {
  id: string;
  name: string;
  clientPrice: number | string; // Prix payé par le client (peut être "Sur devis")
  providerPrice: number | string; // Prix reçu par le prestataire (calculé automatiquement)
}

export interface UniverseCategory {
  id: string;
  name: string;
  description: string;
  subServices: SubService[];
}

// Fonction pour calculer le prix prestataire (72% du prix client)
export const calculateProviderPrice = (clientPrice: number): number => {
  if (clientPrice === 25) return 18;
  if (clientPrice === 30) return 22;
  if (clientPrice === 40) return 29;
  if (clientPrice === 50) return 36;
  if (clientPrice === 60) return 43;
  return Math.round(clientPrice * 0.72);
};

export const universeServices: UniverseCategory[] = [
  {
    id: 'bika_kids',
    name: 'Bika Kids',
    description: 'Services dédiés aux enfants',
    subServices: [
      {
        id: 'garde-enfants-babysitting',
        name: 'Garde d\'enfants & Baby-sitting',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'gardes-de-nuit-urgence',
        name: 'Gardes de nuit ou d\'urgence',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'anniversaires-evenements',
        name: 'Anniversaires & Évènements',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'soutien-scolaire',
        name: 'Soutien scolaire',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_maison',
    name: 'Bika Maison',
    description: 'Gestion du foyer',
    subServices: [
      {
        id: 'courses-approvisionnement',
        name: 'Courses & Approvisionnement',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'courses-urgentes-nuit',
        name: 'Courses urgentes et de nuit',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'logistique-organisation',
        name: 'Logistique & Organisation',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'aide-demenagement-amenagement',
        name: 'Aide au déménagement et à l\'aménagement',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'entretien-jardins-espaces-verts',
        name: 'Entretien jardins et espaces verts',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_vie',
    name: 'Bika Vie',
    description: 'Conciergerie complète',
    subServices: [
      {
        id: 'services-administratifs-familiaux',
        name: 'Services administratifs familiaux',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'services-personnels',
        name: 'Services personnels',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'assistance-quotidienne',
        name: 'Assistance quotidienne',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_travel',
    name: 'Bika Travel',
    description: 'Assistance voyage',
    subServices: [
      {
        id: 'preparation-voyage',
        name: 'Préparation voyage',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'formalites-documents',
        name: 'Formalités & Documents',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'assistance-24-7',
        name: 'Assistance 24h/7j en cas de problème',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_animals',
    name: 'Bika Animal',
    description: 'Univers animalier',
    subServices: [
      {
        id: 'soins-quotidiens',
        name: 'Soins quotidiens',
        clientPrice: 25,
        providerPrice: 18
      },
      {
        id: 'services-veterinaires',
        name: 'Services vétérinaires',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'garde-pension',
        name: 'Garde & Pension',
        clientPrice: 30,
        providerPrice: 22
      }
    ]
  },
  {
    id: 'bika_seniors',
    name: 'Bika Seniors',
    description: 'Accompagnement personnes âgées',
    subServices: [
      {
        id: 'assistance-quotidienne',
        name: 'Assistance quotidienne',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'support-medical',
        name: 'Support médical',
        clientPrice: 30,
        providerPrice: 22
      },
      {
        id: 'urgences-24-7',
        name: 'Urgences 24h/7j',
        clientPrice: 40,
        providerPrice: 29
      }
    ]
  },
  {
    id: 'bika_pro',
    name: 'Bika Pro',
    description: 'Services aux entreprises',
    subServices: [
      {
        id: 'support-administratif',
        name: 'Support administratif',
        clientPrice: 40,
        providerPrice: 29
      },
      {
        id: 'assistance-dirigeants',
        name: 'Assistance dirigeants',
        clientPrice: 60,
        providerPrice: 43
      },
      {
        id: 'conciergerie-entreprise',
        name: 'Conciergerie d\'entreprise',
        clientPrice: 50,
        providerPrice: 36
      }
    ]
  },
  {
    id: 'bika_plus',
    name: 'Bika Plus',
    description: 'Services sur mesure',
    subServices: [
      {
        id: 'projets-personnalises',
        name: 'Projets personnalisés',
        clientPrice: 'Sur devis',
        providerPrice: 'Sur devis'
      },
      {
        id: 'services-exclusifs',
        name: 'Services exclusifs',
        clientPrice: 'Sur devis',
        providerPrice: 'Sur devis'
      },
      {
        id: 'formules-premium',
        name: 'Formules premium',
        clientPrice: 1500,
        providerPrice: 1080
      }
    ]
  }
];
