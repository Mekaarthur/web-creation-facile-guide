export type SubService = {
  slug: string;
  title: string;
  price: number;
  priceDisplay?: string;
  image: string; // path under /src/assets
  description: string;
  options?: string[];
};

export type ServiceCategoryKey =
  | "kids"
  | "maison"
  | "vie"
  | "travel"
  | "animals"
  | "seniors"
  | "pro";

export type ServiceCategory = {
  key: ServiceCategoryKey;
  title: string;
  packageTitle: string;
  subservices: SubService[];
};

export const servicesData: Record<ServiceCategoryKey, ServiceCategory> = {
  kids: {
    key: "kids",
    title: "Bika Kids - Services dédiés aux enfants",
    packageTitle: "Bika Kids",
    subservices: [
      {
        slug: "garde-enfants-babysitting",
        title: "Garde d’enfants & Baby-sitting",
        price: 25,
        image: "/src/assets/service-kids.jpg",
        description:
          "Garde ponctuelle et régulière (après-école, vacances), garde partagée, sorties et aide aux devoirs.",
        options: [
          "Garde ponctuelle",
          "Garde régulière (après-école, vacances)",
          "Garde partagée entre familles",
          "Récupération à la sortie d'école",
          "Transport vers activités extrascolaires",
          "Accompagnement aux activités sportives",
          "Sorties culturelles (musées, cinéma, parcs)",
          "Aide aux devoirs",
        ],
      },
      {
        slug: "gardes-de-nuit-urgence",
        title: "Gardes de nuit ou d’urgence",
        price: 30,
        image: "/src/assets/service-kids-outings.jpg",
        description:
          "Garde de nuit complète et interventions d’urgence (soirée, weekend), accompagnement enfants malades.",
        options: [
          "Nuit complète / gardes urgentes",
          "Soirée & weekend",
          "Accompagnement enfants malades",
          "Accompagnement aux rendez-vous médicaux",
        ],
      },
      {
        slug: "anniversaires-evenements",
        title: "Anniversaires & Événements",
        price: 30,
        image: "/src/assets/service-kids-outings.jpg",
        description:
          "Organisation complète d’anniversaires et d’événements pour enfants.",
        options: [
          "Animation et jeux pour enfants",
          "Décoration thématique personnalisée",
          "Gestion des invitations et logistique",
          "Photographe et souvenirs",
        ],
      },
      {
        slug: "soutien-scolaire",
        title: "Soutien scolaire",
        price: 30,
        image: "/src/assets/service-kids-homework.jpg",
        description:
          "Accompagnement éducatif à domicile par des intervenants qualifiés.",
        options: ["Cours particuliers à domicile", "Préparation aux examens"],
      },
    ],
  },
  maison: {
    key: "maison",
    title: "Bika Maison - Gestion du foyer",
    packageTitle: "Bika Maison",
    subservices: [
      {
        slug: "courses-approvisionnement",
        title: "Courses & Approvisionnement",
        price: 25,
        image: "/src/assets/service-maison.jpg",
        description:
          "Courses alimentaires, produits spécifiques et gestion des stocks à domicile.",
        options: [
          "Courses alimentaires hebdomadaires",
          "Produits bio / sans gluten",
          "Gestion stocks frigo/placards",
          "Courses urgentes / de nuit",
        ],
      },
      {
        slug: "logistique-organisation",
        title: "Logistique & Organisation",
        price: 25,
        priceDisplay: "25–30€/h",
        image: "/src/assets/service-house-logistics.jpg",
        description:
          "Gestion de la logistique de la maison, artisans, livraisons et coordination.",
        options: [
          "Retrait colis et livraisons",
          "Gestion rdv artisans / techniciens",
          "Coordination travaux / rénovations",
        ],
      },
      {
        slug: "demagement-amenagement",
        title: "Aide au déménagement et aménagement",
        price: 30,
        image: "/src/assets/service-maison-errands.jpg",
        description:
          "Aide pratique pour déménager et organiser vos espaces.",
        options: [
          "Faire les cartons",
          "Transport des meubles et cartons jusqu’au pied de l’immeuble",
          "Rangement et organisation d'espaces",
        ],
      },
      {
        slug: "entretien-maintenance",
        title: "Entretien & Maintenance",
        price: 25,
        priceDisplay: "25–30€/h",
        image: "/src/assets/service-maison-repairs.jpg",
        description:
          "Entretien courant et petits travaux sur demande.",
        options: [
          "Entretien jardins & espaces verts",
          "Montage de meubles",
          "Petits travaux de plomberie",
        ],
      },
    ],
  },
  vie: {
    key: "vie",
    title: "Bika Vie - Conciergerie complète",
    packageTitle: "Bika Vie",
    subservices: [
      {
        slug: "services-administratifs-familiaux",
        title: "Services administratifs familiaux",
        price: 25,
        image: "/src/assets/service-admin.jpg",
        description:
          "Gestion administrative du quotidien avec conseiller dédié.",
        options: [
          "Gestion courrier et documents",
          "Prise rdv médicaux/administratifs",
          "Suivi abonnements",
          "Archivage documents",
        ],
      },
      {
        slug: "services-personnels",
        title: "Services personnels",
        price: 25,
        image: "/src/assets/service-admin-support.jpg",
        description:
          "Services personnels et réservations sur mesure.",
        options: [
          "Dépôt/retrait pressing & cordonnerie",
          "Réservations restaurants / spectacles",
        ],
      },
      {
        slug: "assistance-quotidienne",
        title: "Assistance quotidienne",
        price: 25,
        image: "/src/assets/service-vie-events.jpg",
        description:
          "Accompagnement au quotidien pour libérer votre charge mentale.",
        options: [
          "Gestion planning personnel",
          "Interface avec administrations",
          "Résolution de problèmes du quotidien",
        ],
      },
      {
        slug: "accompagnement-rendez-vous",
        title: "Accompagnement rendez-vous",
        price: 25,
        image: "/src/assets/service-vie-calendar.jpg",
        description:
          "Accompagnement et suivi lors de vos rendez-vous.",
        options: ["Accompagnement et classement des documents personnels"],
      },
    ],
  },
  travel: {
    key: "travel",
    title: "Bika Travel - Assistance voyage",
    packageTitle: "Bika Travel",
    subservices: [
      {
        slug: "preparation-voyage",
        title: "Préparation voyage",
        price: 30,
        image: "/src/assets/service-travel.jpg",
        description:
          "Organisation complète avant départ: transports, hébergements et activités.",
        options: [
          "Réservations billets avion/train",
          "Hébergements (hôtels, locations)",
          "Activités & excursions",
          "Itinéraires personnalisés",
        ],
      },
      {
        slug: "formalites-documents",
        title: "Formalités & Documents",
        price: 30,
        image: "/src/assets/service-travel-assistance.jpg",
        description:
          "Toutes les démarches et assurances pour voyager serein.",
        options: [
          "Passeports / visas",
          "Validité documents voyage",
          "Assurances voyage & rapatriement",
          "Change devises",
        ],
      },
      {
        slug: "assistance-24-7",
        title: "Assistance 24/7",
        price: 30,
        image: "/src/assets/service-travel-full.jpg",
        description:
          "Aide en cas d’imprévu pendant le voyage, partout dans le monde.",
        options: [
          "Gestion imprévus & retards",
          "Modification réservation urgente",
          "Support multilingue à destination",
        ],
      },
      {
        slug: "transferts-aeroport",
        title: "Transferts aéroport",
        price: 30,
        image: "/src/assets/service-travel-airport.jpg",
        description:
          "Organisation des transferts in/out aéroport pour un trajet fluide.",
        options: ["Réservation transfert in/out aéroport"],
      },
    ],
  },
  animals: {
    key: "animals",
    title: "Bika Animals - Univers animalier",
    packageTitle: "Bika Animals",
    subservices: [
      {
        slug: "soins-quotidiens",
        title: "Soins quotidiens",
        price: 25,
        image: "/src/assets/service-animals.jpg",
        description:
          "Tous les soins quotidiens pour le bien-être de vos compagnons.",
        options: [
          "Promenades régulières",
          "Nourrissage & soins",
          "Administration médicaments",
          "Compagnie",
        ],
      },
      {
        slug: "services-veterinaires",
        title: "Services vétérinaires",
        price: 30,
        image: "/src/assets/service-seniors-care.jpg",
        description:
          "Accompagnement médical complet et coordination vétérinaire.",
        options: [
          "Transport vétérinaire",
          "Gestion urgences vétérinaires",
          "Suivi traitements",
        ],
      },
      {
        slug: "garde-pension",
        title: "Garde & Pension",
        price: 30,
        image: "/src/assets/service-pet-care.jpg",
        description:
          "Solutions de garde à domicile ou en famille d’accueil.",
        options: [
          "Garde à domicile",
          "Pension famille agréée",
          "Garde vacances/déplacements",
          "Envoi de nouvelles/photos quotidiennes",
        ],
      },
      {
        slug: "toilettage-hygiene",
        title: "Toilettage & Hygiène",
        price: 25,
        image: "/src/assets/service-animals.jpg",
        description: "Brossage et soins d’hygiène adaptés.",
        options: ["Brossage et soins d’hygiène"],
      },
    ],
  },
  seniors: {
    key: "seniors",
    title: "Bika Seniors - Accompagnement personnes âgées",
    packageTitle: "Bika Seniors",
    subservices: [
      {
        slug: "assistance-quotidienne",
        title: "Assistance quotidienne",
        price: 30,
        image: "/src/assets/service-seniors.jpg",
        description:
          "Aide au quotidien pour une autonomie préservée.",
        options: [
          "Courses & préparation repas",
          "Sorties & promenades",
          "Aide toilette & hygiène de base",
          "Administration médicaments",
          "Compagnie",
        ],
      },
      {
        slug: "support-medical",
        title: "Support médical",
        price: 30,
        image: "/src/assets/service-seniors-assistance.jpg",
        description:
          "Coordination et accompagnement médical en confiance.",
        options: [
          "Rdv médicaux",
          "Suivi traitements",
          "Coordination avec soignants",
        ],
      },
      {
        slug: "maintien-domicile",
        title: "Maintien à domicile",
        price: 35,
        image: "/src/assets/service-seniors-care.jpg",
        description:
          "Sécurisation du logement et aide domestique pour rester chez soi.",
        options: [
          "Aménagement logement sécurisé",
          "Équipements adaptés",
          "Ménage & entretien",
        ],
      },
      {
        slug: "lien-social",
        title: "Lien social",
        price: 30,
        image: "/src/assets/service-seniors.jpg",
        description:
          "Préserver le lien social et lutter contre l’isolement.",
        options: [
          "Visites régulières",
          "Accompagnement activités culturelles",
          "Aide nouvelles technologies",
          "Appels vidéo avec famille",
        ],
      },
    ],
  },
  pro: {
    key: "pro",
    title: "Bika Pro - Services aux entreprises",
    packageTitle: "Bika Pro",
    subservices: [
      {
        slug: "support-administratif",
        title: "Support administratif",
        price: 50,
        image: "/src/assets/service-business-admin.jpg",
        description:
          "Support de direction et coordination pour dirigeants et équipes.",
        options: [
          "Gestion agenda dirigeants",
          "Coordination déplacements",
          "Réservations & logistique",
          "Interface partenaires externes",
        ],
      },
      {
        slug: "conciergerie-entreprise",
        title: "Conciergerie d’entreprise",
        price: 50,
        image: "/src/assets/service-business.jpg",
        description:
          "Avantages salariés et services du quotidien au bureau.",
        options: [
          "Services personnels employés",
          "Pressing et petites courses",
          "Réservations restaurants d’affaires",
          "Organisation cadeaux clients/partenaires",
        ],
      },
      {
        slug: "gestion-urgences",
        title: "Gestion des urgences",
        price: 50,
        image: "/src/assets/service-business-executive.jpg",
        description:
          "Interventions rapides pour résoudre les imprévus personnels des salariés.",
        options: ["Urgences personnelles des salariés"],
      },
      {
        slug: "evenementiel-corporate",
        title: "Événementiel corporate",
        price: 50,
        image: "/src/assets/service-business-full.jpg",
        description: "Organisation d’événements d’entreprise sur mesure.",
        options: ["Organisation d’événements internes et externes"],
      },
    ],
  },
};
