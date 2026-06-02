export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  image: string;
  featured: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "La charge mentale : mon histoire, votre réalité... et notre solution",
    slug: "charge-mentale-histoire-realite-solution",
    description: "L'histoire personnelle d'Anita, co-fondatrice de Bikawo, et comment la charge mentale a façonné notre mission d'aider les familles à retrouver leur équilibre.",
    excerpt: "Cette galère invisible qui nous épuise tous. L'histoire vraie d'une maman au bord du gouffre et la naissance d'une solution concrète pour des milliers de familles.",
    category: "Bien-être",
    readTime: "15 min",
    publishedAt: "2025-01-18",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: true
  },
  {
    id: 2,
    title: "10 signes que vous souffrez de charge mentale",
    slug: "10-signes-charge-mentale",
    description: "Fatigue, irritabilité, oublis... Découvrez les 10 signaux qui révèlent une charge mentale excessive et comment y remédier concrètement.",
    excerpt: "Vous vous réveillez épuisé(e) alors que vous dormez suffisamment ? Votre cerveau ne s'arrête jamais ? Voici les 10 signes qui ne trompent pas.",
    category: "Bien-être",
    readTime: "8 min",
    publishedAt: "2025-01-25",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  },
  {
    id: 3,
    title: "Guide complet pour déléguer sans culpabiliser",
    slug: "guide-deleguer-sans-culpabiliser",
    description: "Pourquoi culpabilise-t-on de demander de l'aide ? Guide pratique en 7 étapes pour déléguer efficacement et retrouver du temps pour soi.",
    excerpt: "\"Je devrais pouvoir tout gérer seul(e).\" Cette pensée vous ronge ? Voici pourquoi déléguer est la décision la plus intelligente que vous puissiez prendre.",
    category: "Organisation",
    readTime: "12 min",
    publishedAt: "2025-02-01",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  },
  {
    id: 4,
    title: "Aide ménagère à Paris : tarifs 2025 et comment payer moitié prix",
    slug: "aide-menagere-paris-tarifs-2025",
    description: "Combien coûte une aide ménagère à Paris en 2025 ? Tarifs détaillés, crédit d'impôt, avance immédiate URSSAF : tout ce que vous devez savoir.",
    excerpt: "Une aide ménagère à Paris, c'est souvent moins cher qu'on ne le croit grâce au crédit d'impôt de 50%. On fait le point sur les vrais tarifs.",
    category: "Économie",
    readTime: "10 min",
    publishedAt: "2025-02-08",
    author: "Arthur - Co-fondateur Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: true
  },
  {
    id: 5,
    title: "Avance immédiate de crédit d'impôt : payez 50% moins cher dès le premier jour",
    slug: "avance-immediate-credit-impot-2025",
    description: "L'avance immédiate URSSAF vous permet de déduire automatiquement 50% du coût de vos services à domicile sans attendre votre déclaration de revenus.",
    excerpt: "Fini l'avance de trésorerie ! Depuis 2022, l'État déduit directement 50% de la facture au moment du paiement. Voici comment en profiter.",
    category: "Économie",
    readTime: "8 min",
    publishedAt: "2025-02-15",
    author: "Arthur - Co-fondateur Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: true
  },
  {
    id: 6,
    title: "Garde d'enfants à Paris : toutes les solutions et leurs prix en 2025",
    slug: "garde-enfants-paris-solutions-2025",
    description: "Crèche, assistante maternelle, garde à domicile, micro-crèche... Comparatif complet des solutions de garde d'enfants à Paris avec les tarifs réels.",
    excerpt: "Trouver une garde d'enfants à Paris relève parfois du parcours du combattant. On compare toutes les solutions pour vous aider à choisir.",
    category: "Parentalité",
    readTime: "12 min",
    publishedAt: "2025-02-22",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  },
  {
    id: 7,
    title: "Batch cooking : préparez les repas de la semaine en 2h le dimanche",
    slug: "batch-cooking-famille-guide-pratique",
    description: "Le batch cooking, c'est l'astuce des familles parisiennes débordées. On vous explique la méthode pas à pas pour ne plus jamais stresser devant le frigo le soir.",
    excerpt: "Et si vous ne cuisiniez vraiment qu'une seule fois par semaine ? Le batch cooking transforme 2h du dimanche en 5 soirs sans stress.",
    category: "Organisation",
    readTime: "10 min",
    publishedAt: "2025-03-01",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  },
  {
    id: 8,
    title: "Sélectionner la meilleure garde d'enfants : le guide complet",
    slug: "selectionner-meilleure-garde-enfants",
    description: "Questions à poser, signaux d'alarme, période d'essai, aspects légaux... Tout ce qu'il faut savoir pour choisir la bonne personne à qui confier vos enfants.",
    excerpt: "Confier ses enfants à quelqu'un, c'est la décision la plus importante qu'un parent puisse prendre. Voici comment ne pas se tromper.",
    category: "Parentalité",
    readTime: "15 min",
    publishedAt: "2025-03-08",
    author: "Anita - Co-fondatrice Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  },
  {
    id: 9,
    title: "Coût réel d'une aide ménagère vs votre temps : le calcul qui change tout",
    slug: "cout-aide-menagere-vs-temps",
    description: "Combien vaut vraiment votre heure ? Cette analyse chiffrée démontre pourquoi déléguer le ménage est souvent rentable, même financièrement.",
    excerpt: "4 heures de ménage par semaine = 208 heures par an. Que vaut ce temps pour vous ? Le calcul est souvent surprenant.",
    category: "Économie",
    readTime: "10 min",
    publishedAt: "2025-03-15",
    author: "Arthur - Co-fondateur Bikawo",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  }
];
