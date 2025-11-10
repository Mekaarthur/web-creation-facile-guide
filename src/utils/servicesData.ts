// Import all service images
import serviceKids from '@/assets/service-kids.jpg';
import serviceKidsHomework from '@/assets/service-kids-homework.jpg';
import serviceKidsOutings from '@/assets/service-kids-outings.jpg';
import serviceMaison from '@/assets/service-maison.jpg';
import serviceMaisonErrands from '@/assets/service-maison-errands.jpg';
import serviceMaisonRepairs from '@/assets/service-maison-repairs.jpg';
import serviceHouseLogistics from '@/assets/service-house-logistics.jpg';
import serviceAdmin from '@/assets/service-admin.jpg';
import serviceAdminSupport from '@/assets/service-admin-support.jpg';
import serviceVieCalendar from '@/assets/service-vie-calendar.jpg';
import serviceVieEvents from '@/assets/service-vie-events.jpg';
import serviceTravel from '@/assets/service-travel.jpg';
import serviceTravelAirport from '@/assets/service-travel-airport.jpg';
import serviceTravelAssistance from '@/assets/service-travel-assistance.jpg';
import serviceTravelKids from '@/assets/service-travel-kids.jpg';
import serviceAnimals from '@/assets/service-animals.jpg';
import servicePetCare from '@/assets/service-pet-care.jpg';
import serviceSeniors from '@/assets/service-seniors.jpg';
import serviceSeniorsAssistance from '@/assets/service-seniors-assistance.jpg';
import serviceseniorsCare from '@/assets/service-seniors-care.jpg';
import serviceBusiness from '@/assets/service-business.jpg';
import serviceBusinessAdmin from '@/assets/service-business-admin.jpg';
import serviceBusinessExecutive from '@/assets/service-business-executive.jpg';
import servicePremium from '@/assets/service-premium.jpg';
import servicePremiumConcierge from '@/assets/service-premium-concierge.jpg';
import servicePremiumFull from '@/assets/service-premium-full.jpg';
import serviceKidsFull from '@/assets/service-kids-full.jpg';
import serviceMaisonFull from '@/assets/service-maison-full.jpg';
import serviceVieFull from '@/assets/service-vie-full.jpg';
import serviceTravelFull from '@/assets/service-travel-full.jpg';
import serviceAnimalsFull from '@/assets/service-animals-full.jpg';
import serviceseniorsFull from '@/assets/service-seniors-full.jpg';
import serviceBusinessFull from '@/assets/service-business-full.jpg';
import serviceHomeCleaning from '@/assets/service-home-cleaning.jpg';
import serviceChildcareEducation from '@/assets/service-childcare-education.jpg';
import serviceChildcareHome from '@/assets/service-childcare-home.jpg';

export type SubService = {
  slug: string;
  title: string;
  price: number;
  priceDisplay?: string;
  image: string;
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
  | "pro"
  | "plus";

export type ServiceCategory = {
  key: ServiceCategoryKey;
  title: string;
  packageTitle: string;
  subservices: SubService[];
};

export const servicesData: Record<ServiceCategoryKey, ServiceCategory> = {
  kids: {
    key: "kids",
    title: "🧸 BIKA KIDS - Services dédiés aux enfants",
    packageTitle: "Bika Kids",
    subservices: [
      {
        slug: "garde-enfants-babysitting",
        title: "Garde d'enfants & Baby-sitting",
        price: 25,
        priceDisplay: "25€/h",
        image: serviceChildcareHome,
        description: "Garde ponctuelle et régulière (après-école, vacances scolaires), garde partagée entre familles, récupération quotidienne à la sortie d'école, transport vers activités extrascolaires, accompagnement aux activités sportives, sorties culturelles (musées, cinéma, parcs), aide aux devoirs.",
        options: [
          "Garde ponctuelle",
          "Garde régulière (après-école, vacances scolaires)",
          "Garde partagée entre familles",
          "Récupération quotidienne à la sortie d'école",
          "Transport vers activités extrascolaires",
          "Accompagnement aux activités sportives",
          "Sorties culturelles (musées, cinéma, parcs)",
          "Aide aux devoirs"
        ],
      },
      {
        slug: "gardes-de-nuit-urgence",
        title: "Gardes de nuit ou d'urgence",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceKids,
        description: "Nuit complète et garde de nuit, urgences (soirée, weekend, urgence), accompagnement enfants malades, accompagnement aux rendez-vous médicaux.",
        options: [
          "Nuit complète et garde de nuit",
          "urgences (soirée, weekend, urgence)",
          "Accompagnement enfants malades",
          "Accompagnement aux rendez-vous médicaux"
        ],
      },
      {
        slug: "anniversaires-evenements",
        title: "Anniversaires & Évènements",
        price: 30,
        priceDisplay: "à partir de 30€/h",
        image: serviceKidsOutings,
        description: "Animation et jeux pour enfants, aide décoration thématique personnalisée, gestion des invitations et logistique, photographe et souvenirs.",
        options: [
          "Animation et jeux pour enfants",
          "Aide Décoration thématique personnalisée",
          "Gestion des invitations et logistique",
          "Photographe et souvenirs"
        ],
      },
      {
        slug: "soutien-scolaire",
        title: "Soutien scolaire",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceKidsHomework,
        description: "Cours particuliers à domicile, préparation aux examens.",
        options: [
          "Cours particuliers à domicile",
          "Préparation aux examens"
        ],
      },
    ],
  },
  maison: {
    key: "maison",
    title: "🏠 BIKA MAISON - Gestion du foyer",
    packageTitle: "Bika Maison",
    subservices: [
      {
        slug: "courses-approvisionnement",
        title: "Courses & Approvisionnement",
        price: 25,
        priceDisplay: "25€/h",
        image: serviceMaison,
        description: "Courses alimentaires hebdomadaires, courses de première nécessité, achats spécialisés (produits bio, sans gluten, etc.), gestion des stocks et inventaire frigo/placards.",
        options: [
          "Courses alimentaires hebdomadaires",
          "Courses de première nécessité",
          "Achats spécialisés (produits bio, sans gluten, etc.)",
          "Gestion des stocks et inventaire frigo/placards"
        ],
      },
      {
        slug: "courses-urgentes-nuit",
        title: "Courses urgentes et de nuit",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceMaisonErrands,
        description: "Courses urgentes et de dernière minute, courses de nuit et livraison.",
        options: [
          "Courses urgentes et de dernière minute",
          "Courses de nuit et livraison"
        ],
      },
      {
        slug: "logistique-organisation",
        title: "Logistique & Organisation",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceHouseLogistics,
        description: "Retrait des colis et livraisons, gestion des documents et courriers, préparation de repas.",
        options: [
          "Retrait des colis et livraisons",
          "Gestion des documents et courriers",
          "Préparation de repas"
        ],
      },
      {
        slug: "rangement-armoire",
        title: "Rangement d'armoire",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceHouseLogistics,
        description: "Organisation et rangement de vos armoires et espaces de rangement.",
        options: [
          "Tri et organisation des vêtements",
          "Optimisation de l'espace",
          "Conseils de rangement"
        ],
      },
      {
        slug: "repassage-vetements",
        title: "Ménage, vaisselle et repassage des vêtements",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceMaisonFull,
        description: "Ménage complet de votre domicile, vaisselle et repassage soigné de vos vêtements.",
        options: [
          "Ménage et nettoyage",
          "Vaisselle",
          "Repassage de tout type de vêtements",
          "Pliage et rangement",
          "Traitement des textiles délicats"
        ],
      },
      {
        slug: "batch-cooking",
        title: "Batch cooking",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceMaison,
        description: "Préparation de repas en grande quantité pour la semaine.",
        options: [
          "Planification des menus hebdomadaires",
          "Courses et approvisionnement",
          "Préparation et conditionnement des repas",
          "Adaptations aux régimes spécifiques"
        ],
      },
      {
        slug: "aide-demenagement-amenagement",
        title: "Aide au déménagement et à l'aménagement",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceMaisonRepairs,
        description: "Faire les cartons, aide au transport des cartons et meubles de la maison vers le rez de chaussée et inversement, rangement et organisation d'espaces.",
        options: [
          "faire les cartons",
          "aide au transport des cartons et meubles de la maison vers le rez de chaussée et inversement",
          "Rangement et organisation d'espaces"
        ],
      },
      {
        slug: "entretien-jardins-espaces-verts",
        title: "Entretien jardins et espaces verts",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceHomeCleaning,
        description: "Entretien des jardins et espaces verts - Sur demande, entretien courant du jardin, tonte de la pelouse, scarification et aération de la pelouse, arrosage (manuel ou installation d'un système automatique), désherbage (manuel, thermique ou sélectif), ramassage des feuilles mortes, traitement des maladies et parasites (dans le respect de la réglementation).",
        options: [
          "Entretien courant du jardin",
          "Tonte de la pelouse",
          "Scarification et aération de la pelouse",
          "Arrosage (manuel ou installation d'un système automatique)",
          "Désherbage (manuel, thermique ou sélectif)",
          "Ramassage des feuilles mortes",
          "Traitement des maladies et parasites (dans le respect de la réglementation)"
        ],
      },
      {
        slug: "maintenance",
        title: "Maintenance",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceMaisonRepairs,
        description: "Aide au montage des meubles, aide à la plomberie de base, aide à l'installation des luminaires.",
        options: [
          "Aide au montage des meubles",
          "Aide à la plomberie de base",
          "Aide à l'installation des luminaires"
        ],
      },
    ],
  },
  vie: {
    key: "vie",
    title: "🔑 BIKA VIE - Conciergerie complète",
    packageTitle: "Bika Vie",
    subservices: [
      {
        slug: "services-administratifs-familiaux",
        title: "Services administratifs familiaux",
        price: 25,
        priceDisplay: "25€/h",
        image: serviceAdmin,
        description: "Gestion du courrier et des documents, prise de rendez-vous médicaux/administratifs, suivi des contrats et abonnements, accompagnement aux rendez-vous, archivage et classement documents personnels.",
        options: [
          "Gestion du courrier et des documents",
          "Prise de rendez-vous médicaux/administratifs",
          "Suivi des contrats et abonnements",
          "Accompagnement aux rendez-vous",
          "Archivage et classement documents personnels"
        ],
      },
      {
        slug: "services-personnels",
        title: "Services personnels",
        price: 25,
        priceDisplay: "25€/h",
        image: serviceAdminSupport,
        description: "Dépôt et retrait de pressing, dépôts et retrait cordonnerie, réservations restaurants et spectacles, recherche et réservation de prestataires.",
        options: [
          "Dépôt et retrait de pressing",
          "dépôts et retrait cordonnerie",
          "Réservations restaurants et spectacles",
          "Recherche et réservation de prestataires"
        ],
      },
      {
        slug: "assistance-quotidienne",
        title: "Assistance quotidienne",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceVieEvents,
        description: "Gestion de planning personnel, interface avec administrations et services, résolution de problèmes du quotidien.",
        options: [
          "Gestion de planning personnel",
          "Interface avec administrations et services",
          "Résolution de problèmes du quotidien"
        ],
      },
    ],
  },
  travel: {
    key: "travel",
    title: "✈️ BIKA TRAVEL - Assistance voyage",
    packageTitle: "Bika Travel",
    subservices: [
      {
        slug: "preparation-voyage",
        title: "Préparation voyage",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceTravel,
        description: "Recherche et réservation billets d'avion/train, réservation hébergements (hôtels, locations), réservation activités et excursions, vérification documents de voyage, organisation itinéraires personnalisés.",
        options: [
          "Recherche et réservation billets d'avion/train",
          "Réservation hébergements (hôtels, locations)",
          "Réservation activités et excursions",
          "Vérification documents de voyage",
          "Organisation itinéraires personnalisés"
        ],
      },
      {
        slug: "formalites-documents",
        title: "Formalités & Documents",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceTravelAssistance,
        description: "Assistance renouvellement passeports/visas, vérification et rappel validité documents, réservation transfert in/out aéroport, recherche et souscription assurances voyage et rapatriement, aide au Change de devises.",
        options: [
          "Assistance renouvellement passeports/visas",
          "Vérification et rappel validité documents",
          "Réservation transfert in/out aéroport",
          "Recherche et souscription assurances voyage et rapatriement",
          "Aide au Change de devises"
        ],
      },
      {
        slug: "assistance-24-7",
        title: "Assistance 24h/7j en cas de problème",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceTravelAirport,
        description: "Aide à la Modification réservations en urgence, aide à la Gestion des imprévus et retards, support multilingue à destination.",
        options: [
          "Aide à la Modification réservations en urgence",
          "Aide à la Gestion des imprévus et retards",
          "Support multilingue à destination"
        ],
      },
    ],
  },
  animals: {
    key: "animals",
    title: "🐾 BIKA ANIMAL - Univers animalier",
    packageTitle: "Bika Animal",
    subservices: [
      {
        slug: "soins-quotidiens",
        title: "Soins quotidiens",
        price: 25,
        priceDisplay: "25€/h",
        image: serviceAnimals,
        description: "Promenades et sorties régulières, nourrissage et soins à domicile, administration médicaments, brossage et soins d'hygiène, compagnie pour animaux seuls.",
        options: [
          "Promenades et sorties régulières",
          "Nourrissage et soins à domicile",
          "Administration médicaments",
          "Brossage et soins d'hygiène",
          "Compagnie pour animaux seuls"
        ],
      },
      {
        slug: "services-veterinaires",
        title: "Services vétérinaires",
        price: 30,
        priceDisplay: "30€/h",
        image: servicePetCare,
        description: "Transport chez le vétérinaire, accompagnement rendez-vous médicaux, gestion des urgences vétérinaires, suivi traitements et convalescence, coordination avec professionnels animaliers.",
        options: [
          "Transport chez le vétérinaire",
          "Accompagnement rendez-vous médicaux",
          "Gestion des urgences vétérinaires",
          "Suivi traitements et convalescence",
          "Coordination avec professionnels animaliers"
        ],
      },
      {
        slug: "garde-pension",
        title: "Garde & Pension",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceAnimalsFull,
        description: "Garde à domicile (propriétaire absent), pension dans famille d'accueil agréée, garde pendant vacances/déplacements, sorties et exercice adaptés, envoi de nouvelles et photos quotidiennes.",
        options: [
          "Garde à domicile (propriétaire absent)",
          "Pension dans famille d'accueil agréée",
          "Garde pendant vacances/déplacements",
          "Sorties et exercice adaptés",
          "Envoi de nouvelles et photos quotidiennes"
        ],
      },
    ],
  },
  seniors: {
    key: "seniors",
    title: "👴 BIKA SENIORS - Accompagnement personnes âgées",
    packageTitle: "Bika Seniors",
    subservices: [
      {
        slug: "assistance-quotidienne",
        title: "Assistance quotidienne",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceSeniors,
        description: "Aide aux courses et préparation repas, accompagnement sorties et promenades, aide à la toilette et soins d'hygiène, administration médicaments, compagnie et conversation, gestion administrative et courrier.",
        options: [
          "Aide aux courses et préparation repas",
          "Accompagnement sorties et promenades",
          "Aide à la toilette et soins d'hygiène",
          "Administration médicaments",
          "Compagnie et conversation",
          "Gestion administrative et courrier"
        ],
      },
      {
        slug: "support-medical",
        title: "Support médical",
        price: 30,
        priceDisplay: "30€/h",
        image: serviceSeniorsAssistance,
        description: "Accompagnement rendez-vous médicaux, coordination avec équipe soignante, gestion des traitements, surveillance état de santé, liaison avec famille et médecins.",
        options: [
          "Accompagnement rendez-vous médicaux",
          "Coordination avec équipe soignante",
          "Gestion des traitements",
          "Surveillance état de santé",
          "Liaison avec famille et médecins"
        ],
      },
      {
        slug: "urgences-24-7",
        title: "Urgences 24h/7j",
        price: 40,
        priceDisplay: "40€/h",
        image: serviceseniorsCare,
        description: "Assistance d'urgence jour et nuit, coordination avec services d'urgence, gestion de crises et situations délicates, accompagnement famille en cas d'urgence, suivi médical renforcé.",
        options: [
          "Assistance d'urgence jour et nuit",
          "Coordination avec services d'urgence",
          "Gestion de crises et situations délicates",
          "Accompagnement famille en cas d'urgence",
          "Suivi médical renforcé"
        ],
      },
    ],
  },
  pro: {
    key: "pro",
    title: "💼 BIKA PRO - Services aux entreprises",
    packageTitle: "Bika Pro",
    subservices: [
      {
        slug: "support-administratif",
        title: "Support administratif",
        price: 40,
        priceDisplay: "40€/h",
        image: serviceBusinessAdmin,
        description: "Gestion administrative complète, secrétariat et prise de rendez-vous, organisation de réunions et événements, gestion des déplacements professionnels, interface avec partenaires et clients.",
        options: [
          "Gestion administrative complète",
          "Secrétariat et prise de rendez-vous",
          "Organisation de réunions et événements",
          "Gestion des déplacements professionnels",
          "Interface avec partenaires et clients"
        ],
      },
      {
        slug: "assistance-dirigeants",
        title: "Assistance dirigeants",
        price: 60,
        priceDisplay: "60€/h",
        image: serviceBusinessExecutive,
        description: "Assistance personnalisée cadres supérieurs, gestion des priorités et planning, coordination projets stratégiques, gestion réservations et logistique, interface avec partenaires externes.",
        options: [
          "Assistance personnalisée cadres supérieurs",
          "Gestion des priorités et planning",
          "Coordination projets stratégiques",
          "Gestion réservations et logistique",
          "Interface avec partenaires externes"
        ],
      },
      {
        slug: "conciergerie-entreprise",
        title: "Conciergerie d'entreprise",
        price: 50,
        priceDisplay: "à partir de 50€/h",
        image: serviceBusiness,
        description: "Services personnels pour employés, pressing et petites courses, réservations restaurants d'affaires, organisation cadeaux clients/partenaires, gestion des urgences personnelles salariés.",
        options: [
          "Services personnels pour employés",
          "Pressing et petites courses",
          "Réservations restaurants d'affaires",
          "Organisation cadeaux clients/partenaires",
          "Gestion des urgences personnelles salariés"
        ],
      },
    ],
  },
  plus: {
    key: "plus",
    title: "💎 BIKA PLUS - Services sur mesure",
    packageTitle: "Bika Plus",
    subservices: [
      {
        slug: "projets-personnalises",
        title: "Projets personnalisés",
        price: 0,
        priceDisplay: "Sur devis",
        image: servicePremium,
        description: "Étude besoins spécifiques clients, conception solutions sur mesure, coordination équipes multidisciplinaires, suivi projet de A à Z, adaptation en temps réel.",
        options: [
          "Étude besoins spécifiques clients",
          "Conception solutions sur mesure", 
          "Coordination équipes multidisciplinaires",
          "Suivi projet de A à Z",
          "Adaptation en temps réel"
        ],
      },
      {
        slug: "services-exclusifs",
        title: "Services exclusifs",
        price: 0,
        priceDisplay: "Sur devis",
        image: servicePremiumConcierge,
        description: "Majordome personnel à temps plein/partiel, gestionnaire de patrimoine familial, organisateur de grands événements privés, coordinateur de résidences multiples, assistant personnel haute qualité.",
        options: [
          "Majordome personnel à temps plein/partiel",
          "Gestionnaire de patrimoine familial",
          "Organisateur de grands événements privés",
          "Coordinateur de résidences multiples",
          "Assistant personnel haute qualité"
        ],
      },
      {
        slug: "formules-premium",
        title: "Formules premium",
        price: 1500,
        priceDisplay: "À partir de 1500€/mois",
        image: servicePremiumFull,
        description: "Service 24h/24 et 7j/7, équipe dédiée à une famille, interventions d'urgence prioritaires, accès services partenaires exclusifs, reporting détaillé et personnalisé.",
        options: [
          "Service 24h/24 et 7j/7",
          "Équipe dédiée à une famille",
          "Interventions d'urgence prioritaires",
          "Accès services partenaires exclusifs",
          "Reporting détaillé et personnalisé"
        ],
      },
    ],
  },
};
