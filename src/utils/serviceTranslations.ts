import { ServiceCategoryKey } from '@/utils/servicesData';

// English translations for service categories and subservices
// Only English is provided here. French falls back to original servicesData content.
export type ServiceTranslations = Partial<
  Record<
    ServiceCategoryKey,
    {
      title?: string;
      subservices?: Record<
        string,
        {
          title?: string;
          description?: string;
          options?: string[];
        }
      >;
    }
  >
>;

export const serviceTranslations: ServiceTranslations = {
  kids: {
    title: '🧸 BIKA KIDS - Children\'s services',
    subservices: {
      'garde-enfants-babysitting': {
        title: 'Childcare & Babysitting',
        description:
          "Occasional and regular care (after school, school holidays), shared care between families, daily school pickup, transport to extracurricular activities, accompaniment to sports, cultural outings (museums, cinema, parks), homework help.",
        options: [
          'Occasional care',
          'Regular care (after school, school holidays)',
          'Shared care between families',
          'Daily school pickup',
          'Transport to extracurricular activities',
          'Accompaniment to sports activities',
          'Cultural outings (museums, cinema, parks)',
          'Homework help',
        ],
      },
      'gardes-de-nuit-urgence': {
        title: 'Night or emergency care',
        description:
          'Full night and overnight care, emergencies (evening, weekend, last-minute), caring for sick children, accompaniment to medical appointments.',
        options: [
          'Full night and overnight care',
          'Emergencies (evening, weekend, last-minute)',
          'Support for sick children',
          'Accompaniment to medical appointments',
        ],
      },
      'anniversaires-evenements': {
        title: 'Birthdays & Events',
        description:
          'Entertainment and games for children, help with personalized themed decoration, managing invitations and logistics, photographer and keepsakes.',
        options: [
          'Entertainment and games for children',
          'Help with personalized themed decoration',
          'Managing invitations and logistics',
          'Photographer and keepsakes',
        ],
      },
      'soutien-scolaire': {
        title: 'Tutoring',
        description: 'Private lessons at home, exam preparation.',
        options: ['Private lessons at home', 'Exam preparation'],
      },
    },
  },
  maison: {
    title: '🏠 BIKA MAISON - Home management',
    subservices: {
      'courses-approvisionnement': {
        title: 'Groceries & Supplies',
        description:
          'Weekly grocery shopping, essentials, specialized purchases (organic, gluten-free, etc.), stock management and fridge/pantry inventory.',
        options: [
          'Weekly grocery shopping',
          'Essential purchases',
          'Specialized purchases (organic, gluten-free, etc.)',
          'Stock management and fridge/pantry inventory',
        ],
      },
      'courses-urgentes-nuit': {
        title: 'Urgent and night errands',
        description: 'Last-minute urgent errands, night errands and delivery.',
        options: ['Last-minute urgent errands', 'Night errands and delivery'],
      },
      'logistique-organisation': {
        title: 'Logistics & Organization',
        description:
          'Parcel pickup and deliveries, document and mail management, batch cooking.',
        options: [
          'Parcel pickup and deliveries',
          'Document and mail management',
          'Batch cooking',
        ],
      },
      'aide-demenagement-amenagement': {
        title: 'Moving and settling assistance',
        description:
          'Packing boxes, helping carry boxes and furniture up/down, tidying and space organization.',
        options: [
          'Packing boxes',
          'Helping carry boxes and furniture up/down',
          'Tidying and space organization',
        ],
      },
      'rangement-armoire': {
        title: 'Closet organization',
        description: 'Organization and tidying of your closets and storage spaces.',
        options: [
          'Sorting and organizing clothes',
          'Space optimization',
          'Organization tips',
        ],
      },
      'repassage-vetements': {
        title: 'Cleaning, dishes and ironing',
        description: 'Complete home cleaning, dishes and careful ironing of your clothes.',
        options: [
          'Cleaning and housekeeping',
          'Dishes',
          'Ironing all types of clothes',
          'Folding and storage',
          'Delicate fabric care',
        ],
      },
      'batch-cooking': {
        title: 'Batch cooking',
        description: 'Preparing meals in large quantities for the week.',
        options: [
          'Weekly menu planning',
          'Groceries and shopping',
          'Meal preparation and packaging',
          'Adaptations to specific diets',
        ],
      },
      'entretien-jardins-espaces-verts': {
        title: 'Garden and green space maintenance',
        description:
          "Ongoing garden maintenance, lawn mowing, scarifying and aeration, watering (manual or installing an automatic system), weeding (manual, thermal or selective), collecting dead leaves, treating diseases and pests (in compliance with regulations).",
        options: [
          'Ongoing garden maintenance',
          'Lawn mowing',
          'Scarifying and aeration',
          'Watering (manual or installing an automatic system)',
          'Weeding (manual, thermal or selective)',
          'Collecting dead leaves',
          'Treating diseases and pests (in compliance with regulations)',
        ],
      },
      maintenance: {
        title: 'Maintenance',
        description: 'Furniture assembly help, basic plumbing assistance, light fixture installation help.',
        options: ['Furniture assembly help', 'Basic plumbing assistance', 'Light fixture installation help'],
      },
    },
  },
  vie: {
    title: '🔑 BIKA VIE - Full concierge',
    subservices: {
      'services-administratifs-familiaux': {
        title: 'Family administrative services',
        description:
          'Mail and document management, medical/administrative appointment booking, contract and subscription follow-up, accompaniment to appointments, archiving and filing personal documents.',
        options: [
          'Mail and document management',
          'Booking medical/administrative appointments',
          'Contract and subscription follow-up',
          'Accompaniment to appointments',
          'Archiving and filing personal documents',
        ],
      },
      'services-personnels': {
        title: 'Personal services',
        description:
          'Dry cleaning drop-off and pickup, cobbler drop-off/pickup, restaurant and show bookings, search and booking of service providers.',
        options: [
          'Dry cleaning drop-off and pickup',
          'Cobbler drop-off and pickup',
          'Restaurant and show bookings',
          'Search and booking of service providers',
        ],
      },
      'assistance-quotidienne': {
        title: 'Daily assistance',
        description:
          'Personal schedule management, interface with administrations and services, solving day-to-day issues.',
        options: [
          'Personal schedule management',
          'Interface with administrations and services',
          'Solving day-to-day issues',
        ],
      },
    },
  },
  travel: {
    title: '✈️ BIKA TRAVEL - Travel assistance',
    subservices: {
      'preparation-voyage': {
        title: 'Travel planning',
        description:
          "Search and book plane/train tickets, accommodation (hotels, rentals), activities and excursions, check travel documents, organize personalized itineraries.",
        options: [
          'Search and booking of plane/train tickets',
          'Accommodation booking (hotels, rentals)',
          'Activities and excursions booking',
          'Checking travel documents',
          'Organizing personalized itineraries',
        ],
      },
      'formalites-documents': {
        title: 'Formalities & Documents',
        description:
          'Assistance with passport/visa renewals, checking and reminding document validity, booking airport transfers, searching and subscribing travel and repatriation insurance, currency exchange assistance.',
        options: [
          'Assistance with passport/visa renewals',
          'Checking and reminding document validity',
          'Booking airport transfers',
          'Searching and subscribing travel and repatriation insurance',
          'Currency exchange assistance',
        ],
      },
      'assistance-24-7': {
        title: '24/7 assistance in case of issues',
        description:
          'Help with urgent booking changes, handling unforeseen events and delays, multilingual support at destination.',
        options: [
          'Help with urgent booking changes',
          'Handling unforeseen events and delays',
          'Multilingual support at destination',
        ],
      },
    },
  },
  animals: {
    title: '🐾 BIKA ANIMAL - Pet care services',
    subservices: {
      'soins-quotidiens': {
        title: 'Daily care',
        description:
          "Regular walks and outings, feeding and at-home care, administering medication, brushing and hygiene care, companionship for pets left alone.",
        options: [
          'Regular walks and outings',
          'Feeding and at-home care',
          'Administering medication',
          'Brushing and hygiene care',
          'Companionship for pets left alone',
        ],
      },
      'services-veterinaires': {
        title: 'Veterinary services',
        description:
          'Transport to the vet, accompaniment to medical appointments, managing veterinary emergencies, monitoring treatments and recovery, coordination with pet professionals.',
        options: [
          'Transport to the vet',
          'Accompaniment to medical appointments',
          'Managing veterinary emergencies',
          'Monitoring treatments and recovery',
          'Coordination with pet professionals',
        ],
      },
      'garde-pension': {
        title: 'Pet sitting & Boarding',
        description:
          'At-home sitting (owner away), boarding with an approved host family, care during holidays/trips, tailored exercise and outings, daily updates and photos.',
        options: [
          'At-home sitting (owner away)',
          'Boarding with an approved host family',
          'Care during holidays/trips',
          'Tailored exercise and outings',
          'Daily updates and photos',
        ],
      },
    },
  },
  seniors: {
    title: '👴 BIKA SENIORS - Support for elderly people',
    subservices: {
      'assistance-quotidienne': {
        title: 'Daily assistance',
        description:
          "Help with groceries and meal preparation, accompaniment for outings and walks, hygiene and personal care support, medication administration, companionship and conversation, administrative and mail management.",
        options: [
          'Help with groceries and meal preparation',
          'Accompaniment for outings and walks',
          'Hygiene and personal care support',
          'Medication administration',
          'Companionship and conversation',
          'Administrative and mail management',
        ],
      },
      'support-medical': {
        title: 'Medical support',
        description:
          'Accompaniment to medical appointments, coordination with the care team, treatment management, health monitoring, liaison with family and doctors.',
        options: [
          'Accompaniment to medical appointments',
          'Coordination with the care team',
          'Treatment management',
          'Health monitoring',
          'Liaison with family and doctors',
        ],
      },
      'urgences-24-7': {
        title: '24/7 emergencies',
        description:
          'Emergency assistance day and night, coordination with emergency services, handling crises and sensitive situations, supporting the family in emergencies, reinforced medical follow-up.',
        options: [
          'Emergency assistance day and night',
          'Coordination with emergency services',
          'Handling crises and sensitive situations',
          'Supporting the family in emergencies',
          'Reinforced medical follow-up',
        ],
      },
    },
  },
  pro: {
    title: '💼 BIKA PRO - Business services',
    subservices: {
      'support-administratif': {
        title: 'Administrative support',
        description:
          'Comprehensive administrative management, secretarial and appointment scheduling, meeting and event organization, business travel management, liaison with partners and clients.',
        options: [
          'Comprehensive administrative management',
          'Secretarial and appointment scheduling',
          'Meeting and event organization',
          'Business travel management',
          'Liaison with partners and clients',
        ],
      },
      'assistance-dirigeants': {
        title: 'Executive assistance',
        description:
          'Personalized support for senior executives, priority and schedule management, coordination of strategic projects, booking and logistics, interface with external partners.',
        options: [
          'Personalized support for senior executives',
          'Priority and schedule management',
          'Coordination of strategic projects',
          'Booking and logistics management',
          'Interface with external partners',
        ],
      },
      'conciergerie-entreprise': {
        title: "Corporate concierge",
        description:
          "Personal services for employees, dry cleaning and small errands, business restaurant bookings, organizing client/partner gifts, handling employees' personal emergencies.",
        options: [
          'Personal services for employees',
          'Dry cleaning and small errands',
          "Business restaurant bookings",
          'Organizing client/partner gifts',
          "Handling employees' personal emergencies",
        ],
      },
    },
  },
  plus: {
    title: '💎 BIKA PLUS - Bespoke services',
    subservices: {
      'projets-personnalises': {
        title: 'Custom projects',
        description:
          'Assess specific client needs, design tailor-made solutions, coordinate multidisciplinary teams, end-to-end project follow-up, real-time adaptation.',
        options: [
          'Assess specific client needs',
          'Design tailor-made solutions',
          'Coordinate multidisciplinary teams',
          'End-to-end project follow-up',
          'Real-time adaptation',
        ],
      },
      'services-exclusifs': {
        title: 'Exclusive services',
        description:
          'Full/part-time personal butler, family estate manager, organizer of major private events, coordinator of multiple residences, high-end personal assistant.',
        options: [
          'Full/part-time personal butler',
          'Family estate manager',
          'Organizer of major private events',
          'Coordinator of multiple residences',
          'High-end personal assistant',
        ],
      },
      'formules-premium': {
        title: 'Premium plans',
        description:
          '24/7 service, a dedicated team for one family, priority emergency interventions, access to exclusive partner services, detailed and personalized reporting.',
        options: [
          '24/7 service',
          'Dedicated team for one family',
          'Priority emergency interventions',
          'Access to exclusive partner services',
          'Detailed and personalized reporting',
        ],
      },
    },
  },
};
