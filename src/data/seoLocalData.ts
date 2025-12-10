// Données SEO locales pour l'Île-de-France et Oise
// Ton: Chaleureux et familial

export interface LocalCity {
  name: string;
  slug: string;
  department: string;
  departmentCode: string;
  population?: number;
  keywords: string[];
}

export interface LocalService {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  description: string;
  keywords: string[];
  taxCreditEligible: boolean;
}

// Services proposés par Bikawo
export const services: LocalService[] = [
  {
    id: 'menage',
    name: 'Ménage et repassage à domicile',
    slug: 'menage-repassage',
    shortName: 'Ménage',
    description: 'Service de ménage et repassage à domicile par des professionnels de confiance',
    keywords: ['ménage', 'repassage', 'nettoyage', 'entretien maison', 'femme de ménage'],
    taxCreditEligible: true,
  },
  {
    id: 'garde-enfants',
    name: 'Garde d\'enfants et babysitting',
    slug: 'garde-enfants',
    shortName: 'Garde d\'enfants',
    description: 'Service de garde d\'enfants et babysitting par des nounous expérimentées',
    keywords: ['garde enfants', 'babysitting', 'nounou', 'baby-sitter', 'garde périscolaire'],
    taxCreditEligible: true,
  },
  {
    id: 'aide-seniors',
    name: 'Aide aux seniors et personnes âgées',
    slug: 'aide-seniors',
    shortName: 'Aide seniors',
    description: 'Accompagnement et aide quotidienne pour les personnes âgées',
    keywords: ['aide seniors', 'personnes âgées', 'maintien à domicile', 'accompagnement'],
    taxCreditEligible: true,
  },
  {
    id: 'soutien-scolaire',
    name: 'Soutien scolaire et aide aux devoirs',
    slug: 'soutien-scolaire',
    shortName: 'Soutien scolaire',
    description: 'Cours particuliers et aide aux devoirs pour tous les niveaux',
    keywords: ['soutien scolaire', 'aide devoirs', 'cours particuliers', 'professeur'],
    taxCreditEligible: true,
  },
  {
    id: 'pet-sitting',
    name: 'Garde d\'animaux et pet-sitting',
    slug: 'garde-animaux',
    shortName: 'Garde animaux',
    description: 'Service de garde d\'animaux et promenade par des passionnés',
    keywords: ['garde animaux', 'pet-sitting', 'promenade chien', 'garde chat'],
    taxCreditEligible: false,
  },
  {
    id: 'bricolage',
    name: 'Bricolage et petits travaux',
    slug: 'bricolage',
    shortName: 'Bricolage',
    description: 'Service de bricolage et petits travaux à domicile',
    keywords: ['bricolage', 'petits travaux', 'réparation', 'montage meuble'],
    taxCreditEligible: true,
  },
  {
    id: 'jardinage',
    name: 'Jardinage et entretien extérieur',
    slug: 'jardinage',
    shortName: 'Jardinage',
    description: 'Entretien de jardin et espaces verts par des jardiniers qualifiés',
    keywords: ['jardinage', 'entretien jardin', 'tonte pelouse', 'taille haie'],
    taxCreditEligible: true,
  },
];

// Villes par département
export const cities: LocalCity[] = [
  // Paris (75)
  { name: 'Paris', slug: 'paris', department: 'Paris', departmentCode: '75', population: 2161000, keywords: ['paris', 'capitale', 'paris intramuros'] },
  { name: 'Paris 1er', slug: 'paris-1er', department: 'Paris', departmentCode: '75', keywords: ['paris 1', 'louvre', 'châtelet'] },
  { name: 'Paris 2ème', slug: 'paris-2eme', department: 'Paris', departmentCode: '75', keywords: ['paris 2', 'bourse', 'sentier'] },
  { name: 'Paris 3ème', slug: 'paris-3eme', department: 'Paris', departmentCode: '75', keywords: ['paris 3', 'marais', 'temple'] },
  { name: 'Paris 4ème', slug: 'paris-4eme', department: 'Paris', departmentCode: '75', keywords: ['paris 4', 'notre-dame', 'bastille'] },
  { name: 'Paris 5ème', slug: 'paris-5eme', department: 'Paris', departmentCode: '75', keywords: ['paris 5', 'quartier latin', 'panthéon'] },
  { name: 'Paris 6ème', slug: 'paris-6eme', department: 'Paris', departmentCode: '75', keywords: ['paris 6', 'saint-germain', 'luxembourg'] },
  { name: 'Paris 7ème', slug: 'paris-7eme', department: 'Paris', departmentCode: '75', keywords: ['paris 7', 'tour eiffel', 'invalides'] },
  { name: 'Paris 8ème', slug: 'paris-8eme', department: 'Paris', departmentCode: '75', keywords: ['paris 8', 'champs-élysées', 'madeleine'] },
  { name: 'Paris 9ème', slug: 'paris-9eme', department: 'Paris', departmentCode: '75', keywords: ['paris 9', 'opéra', 'pigalle'] },
  { name: 'Paris 10ème', slug: 'paris-10eme', department: 'Paris', departmentCode: '75', keywords: ['paris 10', 'gare du nord', 'canal saint-martin'] },
  { name: 'Paris 11ème', slug: 'paris-11eme', department: 'Paris', departmentCode: '75', keywords: ['paris 11', 'oberkampf', 'nation'] },
  { name: 'Paris 12ème', slug: 'paris-12eme', department: 'Paris', departmentCode: '75', keywords: ['paris 12', 'bercy', 'bastille'] },
  { name: 'Paris 13ème', slug: 'paris-13eme', department: 'Paris', departmentCode: '75', keywords: ['paris 13', 'gobelins', 'chinatown'] },
  { name: 'Paris 14ème', slug: 'paris-14eme', department: 'Paris', departmentCode: '75', keywords: ['paris 14', 'montparnasse', 'alésia'] },
  { name: 'Paris 15ème', slug: 'paris-15eme', department: 'Paris', departmentCode: '75', keywords: ['paris 15', 'convention', 'vaugirard'] },
  { name: 'Paris 16ème', slug: 'paris-16eme', department: 'Paris', departmentCode: '75', keywords: ['paris 16', 'trocadéro', 'passy'] },
  { name: 'Paris 17ème', slug: 'paris-17eme', department: 'Paris', departmentCode: '75', keywords: ['paris 17', 'batignolles', 'ternes'] },
  { name: 'Paris 18ème', slug: 'paris-18eme', department: 'Paris', departmentCode: '75', keywords: ['paris 18', 'montmartre', 'sacré-coeur'] },
  { name: 'Paris 19ème', slug: 'paris-19eme', department: 'Paris', departmentCode: '75', keywords: ['paris 19', 'buttes-chaumont', 'villette'] },
  { name: 'Paris 20ème', slug: 'paris-20eme', department: 'Paris', departmentCode: '75', keywords: ['paris 20', 'belleville', 'ménilmontant'] },

  // Hauts-de-Seine (92)
  { name: 'Boulogne-Billancourt', slug: 'boulogne-billancourt', department: 'Hauts-de-Seine', departmentCode: '92', population: 121334, keywords: ['boulogne', 'billancourt'] },
  { name: 'Nanterre', slug: 'nanterre', department: 'Hauts-de-Seine', departmentCode: '92', population: 96689, keywords: ['nanterre', 'la défense'] },
  { name: 'Courbevoie', slug: 'courbevoie', department: 'Hauts-de-Seine', departmentCode: '92', population: 82138, keywords: ['courbevoie', 'la défense'] },
  { name: 'Colombes', slug: 'colombes', department: 'Hauts-de-Seine', departmentCode: '92', population: 85368, keywords: ['colombes'] },
  { name: 'Asnières-sur-Seine', slug: 'asnieres-sur-seine', department: 'Hauts-de-Seine', departmentCode: '92', population: 88132, keywords: ['asnières', 'asnières sur seine'] },
  { name: 'Rueil-Malmaison', slug: 'rueil-malmaison', department: 'Hauts-de-Seine', departmentCode: '92', population: 81629, keywords: ['rueil', 'malmaison'] },
  { name: 'Levallois-Perret', slug: 'levallois-perret', department: 'Hauts-de-Seine', departmentCode: '92', population: 65291, keywords: ['levallois', 'perret'] },
  { name: 'Issy-les-Moulineaux', slug: 'issy-les-moulineaux', department: 'Hauts-de-Seine', departmentCode: '92', population: 68451, keywords: ['issy', 'moulineaux'] },
  { name: 'Neuilly-sur-Seine', slug: 'neuilly-sur-seine', department: 'Hauts-de-Seine', departmentCode: '92', population: 60361, keywords: ['neuilly', 'neuilly sur seine'] },
  { name: 'Antony', slug: 'antony', department: 'Hauts-de-Seine', departmentCode: '92', population: 62858, keywords: ['antony'] },
  { name: 'Clichy', slug: 'clichy', department: 'Hauts-de-Seine', departmentCode: '92', population: 63236, keywords: ['clichy'] },
  { name: 'Clamart', slug: 'clamart', department: 'Hauts-de-Seine', departmentCode: '92', population: 53014, keywords: ['clamart'] },
  { name: 'Puteaux', slug: 'puteaux', department: 'Hauts-de-Seine', departmentCode: '92', population: 45442, keywords: ['puteaux', 'la défense'] },
  { name: 'Meudon', slug: 'meudon', department: 'Hauts-de-Seine', departmentCode: '92', population: 45824, keywords: ['meudon'] },
  { name: 'Suresnes', slug: 'suresnes', department: 'Hauts-de-Seine', departmentCode: '92', population: 49773, keywords: ['suresnes'] },
  { name: 'Montrouge', slug: 'montrouge', department: 'Hauts-de-Seine', departmentCode: '92', population: 50168, keywords: ['montrouge'] },
  { name: 'Châtillon', slug: 'chatillon', department: 'Hauts-de-Seine', departmentCode: '92', keywords: ['châtillon'] },
  { name: 'Bagneux', slug: 'bagneux', department: 'Hauts-de-Seine', departmentCode: '92', keywords: ['bagneux'] },
  { name: 'Malakoff', slug: 'malakoff', department: 'Hauts-de-Seine', departmentCode: '92', keywords: ['malakoff'] },
  { name: 'Vanves', slug: 'vanves', department: 'Hauts-de-Seine', departmentCode: '92', keywords: ['vanves'] },

  // Seine-Saint-Denis (93)
  { name: 'Saint-Denis', slug: 'saint-denis', department: 'Seine-Saint-Denis', departmentCode: '93', population: 113134, keywords: ['saint-denis', 'stade de france'] },
  { name: 'Montreuil', slug: 'montreuil', department: 'Seine-Saint-Denis', departmentCode: '93', population: 111310, keywords: ['montreuil'] },
  { name: 'Aubervilliers', slug: 'aubervilliers', department: 'Seine-Saint-Denis', departmentCode: '93', population: 89500, keywords: ['aubervilliers'] },
  { name: 'Aulnay-sous-Bois', slug: 'aulnay-sous-bois', department: 'Seine-Saint-Denis', departmentCode: '93', population: 85740, keywords: ['aulnay', 'aulnay sous bois'] },
  { name: 'Drancy', slug: 'drancy', department: 'Seine-Saint-Denis', departmentCode: '93', population: 71521, keywords: ['drancy'] },
  { name: 'Noisy-le-Grand', slug: 'noisy-le-grand', department: 'Seine-Saint-Denis', departmentCode: '93', population: 70192, keywords: ['noisy le grand'] },
  { name: 'Pantin', slug: 'pantin', department: 'Seine-Saint-Denis', departmentCode: '93', population: 55715, keywords: ['pantin'] },
  { name: 'Bondy', slug: 'bondy', department: 'Seine-Saint-Denis', departmentCode: '93', population: 54095, keywords: ['bondy'] },
  { name: 'Épinay-sur-Seine', slug: 'epinay-sur-seine', department: 'Seine-Saint-Denis', departmentCode: '93', population: 56175, keywords: ['épinay', 'épinay sur seine'] },
  { name: 'Bobigny', slug: 'bobigny', department: 'Seine-Saint-Denis', departmentCode: '93', population: 53640, keywords: ['bobigny'] },
  { name: 'Sevran', slug: 'sevran', department: 'Seine-Saint-Denis', departmentCode: '93', population: 51741, keywords: ['sevran'] },
  { name: 'Le Blanc-Mesnil', slug: 'le-blanc-mesnil', department: 'Seine-Saint-Denis', departmentCode: '93', population: 55684, keywords: ['blanc-mesnil', 'blanc mesnil'] },
  { name: 'Livry-Gargan', slug: 'livry-gargan', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['livry', 'gargan'] },
  { name: 'Rosny-sous-Bois', slug: 'rosny-sous-bois', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['rosny', 'rosny sous bois'] },
  { name: 'Villepinte', slug: 'villepinte', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['villepinte'] },
  { name: 'Tremblay-en-France', slug: 'tremblay-en-france', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['tremblay', 'tremblay en france'] },
  { name: 'Les Lilas', slug: 'les-lilas', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['les lilas'] },
  { name: 'Bagnolet', slug: 'bagnolet', department: 'Seine-Saint-Denis', departmentCode: '93', keywords: ['bagnolet'] },

  // Val-de-Marne (94)
  { name: 'Créteil', slug: 'creteil', department: 'Val-de-Marne', departmentCode: '94', population: 93038, keywords: ['créteil'] },
  { name: 'Vitry-sur-Seine', slug: 'vitry-sur-seine', department: 'Val-de-Marne', departmentCode: '94', population: 95650, keywords: ['vitry', 'vitry sur seine'] },
  { name: 'Saint-Maur-des-Fossés', slug: 'saint-maur-des-fosses', department: 'Val-de-Marne', departmentCode: '94', population: 77287, keywords: ['saint-maur', 'saint maur des fossés'] },
  { name: 'Champigny-sur-Marne', slug: 'champigny-sur-marne', department: 'Val-de-Marne', departmentCode: '94', population: 77883, keywords: ['champigny', 'champigny sur marne'] },
  { name: 'Ivry-sur-Seine', slug: 'ivry-sur-seine', department: 'Val-de-Marne', departmentCode: '94', population: 65232, keywords: ['ivry', 'ivry sur seine'] },
  { name: 'Maisons-Alfort', slug: 'maisons-alfort', department: 'Val-de-Marne', departmentCode: '94', population: 56028, keywords: ['maisons-alfort', 'maisons alfort'] },
  { name: 'Fontenay-sous-Bois', slug: 'fontenay-sous-bois', department: 'Val-de-Marne', departmentCode: '94', population: 54340, keywords: ['fontenay', 'fontenay sous bois'] },
  { name: 'Villejuif', slug: 'villejuif', department: 'Val-de-Marne', departmentCode: '94', population: 58206, keywords: ['villejuif'] },
  { name: 'Vincennes', slug: 'vincennes', department: 'Val-de-Marne', departmentCode: '94', population: 50077, keywords: ['vincennes', 'château de vincennes'] },
  { name: 'Alfortville', slug: 'alfortville', department: 'Val-de-Marne', departmentCode: '94', population: 46072, keywords: ['alfortville'] },
  { name: 'Le Kremlin-Bicêtre', slug: 'le-kremlin-bicetre', department: 'Val-de-Marne', departmentCode: '94', keywords: ['kremlin-bicêtre', 'kremlin bicêtre'] },
  { name: 'Nogent-sur-Marne', slug: 'nogent-sur-marne', department: 'Val-de-Marne', departmentCode: '94', keywords: ['nogent', 'nogent sur marne'] },
  { name: 'Cachan', slug: 'cachan', department: 'Val-de-Marne', departmentCode: '94', keywords: ['cachan'] },
  { name: 'Charenton-le-Pont', slug: 'charenton-le-pont', department: 'Val-de-Marne', departmentCode: '94', keywords: ['charenton'] },
  { name: 'Thiais', slug: 'thiais', department: 'Val-de-Marne', departmentCode: '94', keywords: ['thiais'] },
  { name: 'Joinville-le-Pont', slug: 'joinville-le-pont', department: 'Val-de-Marne', departmentCode: '94', keywords: ['joinville'] },

  // Val-d'Oise (95)
  { name: 'Argenteuil', slug: 'argenteuil', department: "Val-d'Oise", departmentCode: '95', population: 113748, keywords: ['argenteuil'] },
  { name: 'Cergy', slug: 'cergy', department: "Val-d'Oise", departmentCode: '95', population: 66322, keywords: ['cergy', 'cergy-pontoise'] },
  { name: 'Sarcelles', slug: 'sarcelles', department: "Val-d'Oise", departmentCode: '95', population: 59813, keywords: ['sarcelles'] },
  { name: 'Pontoise', slug: 'pontoise', department: "Val-d'Oise", departmentCode: '95', population: 31915, keywords: ['pontoise', 'cergy-pontoise'] },
  { name: 'Bezons', slug: 'bezons', department: "Val-d'Oise", departmentCode: '95', keywords: ['bezons'] },
  { name: 'Franconville', slug: 'franconville', department: "Val-d'Oise", departmentCode: '95', keywords: ['franconville'] },
  { name: 'Garges-lès-Gonesse', slug: 'garges-les-gonesse', department: "Val-d'Oise", departmentCode: '95', keywords: ['garges', 'gonesse'] },
  { name: 'Gonesse', slug: 'gonesse', department: "Val-d'Oise", departmentCode: '95', keywords: ['gonesse'] },
  { name: 'Ermont', slug: 'ermont', department: "Val-d'Oise", departmentCode: '95', keywords: ['ermont'] },
  { name: 'Goussainville', slug: 'goussainville', department: "Val-d'Oise", departmentCode: '95', keywords: ['goussainville'] },
  { name: 'Herblay', slug: 'herblay', department: "Val-d'Oise", departmentCode: '95', keywords: ['herblay'] },
  { name: 'Taverny', slug: 'taverny', department: "Val-d'Oise", departmentCode: '95', keywords: ['taverny'] },
  { name: 'Enghien-les-Bains', slug: 'enghien-les-bains', department: "Val-d'Oise", departmentCode: '95', keywords: ['enghien', 'enghien les bains'] },
  { name: 'Montmorency', slug: 'montmorency', department: "Val-d'Oise", departmentCode: '95', keywords: ['montmorency'] },
  { name: 'Saint-Gratien', slug: 'saint-gratien', department: "Val-d'Oise", departmentCode: '95', keywords: ['saint-gratien'] },

  // Yvelines (78)
  { name: 'Versailles', slug: 'versailles', department: 'Yvelines', departmentCode: '78', population: 85205, keywords: ['versailles', 'château de versailles'] },
  { name: 'Saint-Germain-en-Laye', slug: 'saint-germain-en-laye', department: 'Yvelines', departmentCode: '78', population: 45926, keywords: ['saint-germain', 'saint germain en laye'] },
  { name: 'Mantes-la-Jolie', slug: 'mantes-la-jolie', department: 'Yvelines', departmentCode: '78', population: 46259, keywords: ['mantes', 'mantes la jolie'] },
  { name: 'Sartrouville', slug: 'sartrouville', department: 'Yvelines', departmentCode: '78', population: 52497, keywords: ['sartrouville'] },
  { name: 'Houilles', slug: 'houilles', department: 'Yvelines', departmentCode: '78', keywords: ['houilles'] },
  { name: 'Le Chesnay', slug: 'le-chesnay', department: 'Yvelines', departmentCode: '78', keywords: ['le chesnay', 'chesnay'] },
  { name: 'Poissy', slug: 'poissy', department: 'Yvelines', departmentCode: '78', population: 38310, keywords: ['poissy'] },
  { name: 'Conflans-Sainte-Honorine', slug: 'conflans-sainte-honorine', department: 'Yvelines', departmentCode: '78', keywords: ['conflans', 'conflans sainte honorine'] },
  { name: 'Montigny-le-Bretonneux', slug: 'montigny-le-bretonneux', department: 'Yvelines', departmentCode: '78', keywords: ['montigny', 'saint-quentin-en-yvelines'] },
  { name: 'Trappes', slug: 'trappes', department: 'Yvelines', departmentCode: '78', keywords: ['trappes'] },
  { name: 'Plaisir', slug: 'plaisir', department: 'Yvelines', departmentCode: '78', keywords: ['plaisir'] },
  { name: 'Les Mureaux', slug: 'les-mureaux', department: 'Yvelines', departmentCode: '78', keywords: ['les mureaux', 'mureaux'] },
  { name: 'Chatou', slug: 'chatou', department: 'Yvelines', departmentCode: '78', keywords: ['chatou'] },
  { name: 'Le Pecq', slug: 'le-pecq', department: 'Yvelines', departmentCode: '78', keywords: ['le pecq', 'pecq'] },
  { name: 'Maisons-Laffitte', slug: 'maisons-laffitte', department: 'Yvelines', departmentCode: '78', keywords: ['maisons-laffitte', 'maisons laffitte'] },

  // Essonne (91)
  { name: 'Évry-Courcouronnes', slug: 'evry-courcouronnes', department: 'Essonne', departmentCode: '91', population: 69474, keywords: ['évry', 'courcouronnes', 'evry'] },
  { name: 'Corbeil-Essonnes', slug: 'corbeil-essonnes', department: 'Essonne', departmentCode: '91', population: 51289, keywords: ['corbeil', 'essonnes'] },
  { name: 'Massy', slug: 'massy', department: 'Essonne', departmentCode: '91', population: 50288, keywords: ['massy'] },
  { name: 'Savigny-sur-Orge', slug: 'savigny-sur-orge', department: 'Essonne', departmentCode: '91', keywords: ['savigny', 'savigny sur orge'] },
  { name: 'Sainte-Geneviève-des-Bois', slug: 'sainte-genevieve-des-bois', department: 'Essonne', departmentCode: '91', keywords: ['sainte-geneviève', 'sainte geneviève des bois'] },
  { name: 'Viry-Châtillon', slug: 'viry-chatillon', department: 'Essonne', departmentCode: '91', keywords: ['viry', 'châtillon'] },
  { name: 'Athis-Mons', slug: 'athis-mons', department: 'Essonne', departmentCode: '91', keywords: ['athis', 'athis-mons'] },
  { name: 'Grigny', slug: 'grigny', department: 'Essonne', departmentCode: '91', keywords: ['grigny'] },
  { name: 'Palaiseau', slug: 'palaiseau', department: 'Essonne', departmentCode: '91', keywords: ['palaiseau', 'polytechnique'] },
  { name: 'Orsay', slug: 'orsay', department: 'Essonne', departmentCode: '91', keywords: ['orsay', 'université paris-saclay'] },
  { name: 'Les Ulis', slug: 'les-ulis', department: 'Essonne', departmentCode: '91', keywords: ['les ulis', 'ulis'] },
  { name: 'Draveil', slug: 'draveil', department: 'Essonne', departmentCode: '91', keywords: ['draveil'] },
  { name: 'Yerres', slug: 'yerres', department: 'Essonne', departmentCode: '91', keywords: ['yerres'] },
  { name: 'Brunoy', slug: 'brunoy', department: 'Essonne', departmentCode: '91', keywords: ['brunoy'] },
  { name: 'Longjumeau', slug: 'longjumeau', department: 'Essonne', departmentCode: '91', keywords: ['longjumeau'] },

  // Oise (60)
  { name: 'Beauvais', slug: 'beauvais', department: 'Oise', departmentCode: '60', population: 56254, keywords: ['beauvais'] },
  { name: 'Compiègne', slug: 'compiegne', department: 'Oise', departmentCode: '60', population: 40860, keywords: ['compiègne', 'compiegne'] },
  { name: 'Creil', slug: 'creil', department: 'Oise', departmentCode: '60', population: 36167, keywords: ['creil'] },
  { name: 'Nogent-sur-Oise', slug: 'nogent-sur-oise', department: 'Oise', departmentCode: '60', keywords: ['nogent sur oise'] },
  { name: 'Senlis', slug: 'senlis', department: 'Oise', departmentCode: '60', keywords: ['senlis'] },
  { name: 'Chantilly', slug: 'chantilly', department: 'Oise', departmentCode: '60', keywords: ['chantilly', 'château de chantilly'] },
  { name: 'Méru', slug: 'meru', department: 'Oise', departmentCode: '60', keywords: ['méru'] },
  { name: 'Clermont', slug: 'clermont', department: 'Oise', departmentCode: '60', keywords: ['clermont'] },
  { name: 'Montataire', slug: 'montataire', department: 'Oise', departmentCode: '60', keywords: ['montataire'] },
  { name: 'Noyon', slug: 'noyon', department: 'Oise', departmentCode: '60', keywords: ['noyon'] },
];

// Groupement par département pour affichage
export const departments = [
  { code: '75', name: 'Paris', shortName: 'Paris' },
  { code: '92', name: 'Hauts-de-Seine', shortName: '92' },
  { code: '93', name: 'Seine-Saint-Denis', shortName: '93' },
  { code: '94', name: 'Val-de-Marne', shortName: '94' },
  { code: '95', name: "Val-d'Oise", shortName: '95' },
  { code: '78', name: 'Yvelines', shortName: '78' },
  { code: '91', name: 'Essonne', shortName: '91' },
  { code: '60', name: 'Oise', shortName: '60' },
];

// Fonctions utilitaires
export const getCitiesByDepartment = (departmentCode: string): LocalCity[] => {
  return cities.filter(city => city.departmentCode === departmentCode);
};

export const getCityBySlug = (slug: string): LocalCity | undefined => {
  return cities.find(city => city.slug === slug);
};

export const getServiceBySlug = (slug: string): LocalService | undefined => {
  return services.find(service => service.slug === slug);
};

// Génération des métadonnées SEO
export const generateLocalSEOTitle = (service: LocalService, city: LocalCity): string => {
  return `${service.name} à ${city.name} | Bikawo - Services de confiance`;
};

export const generateLocalSEODescription = (service: LocalService, city: LocalCity): string => {
  const taxCredit = service.taxCreditEligible ? ' Bénéficiez de 50% de crédit d\'impôt.' : '';
  return `Trouvez un professionnel de ${service.shortName.toLowerCase()} de confiance à ${city.name} (${city.departmentCode}). Réservation simple, prestataires vérifiés.${taxCredit} La charge mentale en moins, la sérénité en plus.`;
};

export const generateLocalKeywords = (service: LocalService, city: LocalCity): string[] => {
  const baseKeywords = [
    ...service.keywords.map(k => `${k} ${city.name}`),
    ...service.keywords.map(k => `${k} ${city.departmentCode}`),
    `${service.shortName.toLowerCase()} à domicile ${city.name}`,
    `bikawo ${city.name}`,
    `services à domicile ${city.name}`,
  ];

  if (service.taxCreditEligible) {
    baseKeywords.push(
      `${service.shortName.toLowerCase()} crédit impôt ${city.name}`,
      `service à la personne ${city.name}`
    );
  }

  return baseKeywords;
};

// Génération des données structurées locales
export const generateLocalStructuredData = (service: LocalService, city: LocalCity) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": generateLocalSEOTitle(service, city),
    "description": generateLocalSEODescription(service, city),
    "provider": {
      "@type": "LocalBusiness",
      "name": "Bikawo",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city.name,
        "addressRegion": city.department,
        "postalCode": city.departmentCode,
        "addressCountry": "FR"
      },
      "areaServed": {
        "@type": "City",
        "name": city.name
      },
      "telephone": "+33609085390",
      "url": `https://bikawo.com/services/${service.slug}/${city.slug}`
    },
    "areaServed": {
      "@type": "City",
      "name": city.name,
      "containedInPlace": {
        "@type": "AdministrativeArea",
        "name": city.department
      }
    },
    "serviceType": service.name,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };
};
