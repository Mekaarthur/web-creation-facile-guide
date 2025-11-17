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
    title: "10 signes que vous souffrez de charge mentale",
    slug: "10-signes-charge-mentale",
    description: "Découvrez les signaux d'alarme qui indiquent que votre charge mentale devient ingérable et comment y remédier.",
    excerpt: "La charge mentale touche de nombreux parents et aidants. Fatigue constante, difficultés à prioriser, sentiment d'être débordé... Reconnaissez-vous ces symptômes ?",
    category: "Bien-être",
    readTime: "8 min",
    publishedAt: "2024-01-15",
    author: "Dr. Marie Dubois",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: true
  },
  {
    id: 2,
    title: "Guide complet pour déléguer sans culpabiliser",
    slug: "guide-deleguer-sans-culpabiliser",
    description: "Apprenez à déléguer efficacement vos tâches domestiques et familiales sans ressentir de culpabilité.",
    excerpt: "Déléguer n'est pas un échec, c'est une stratégie intelligente. Découvrez comment libérer du temps pour l'essentiel.",
    category: "Organisation",
    readTime: "12 min",
    publishedAt: "2024-01-10",
    author: "Sophie Martin",
    image: "/lovable-uploads/7289c795-0ba4-4e3f-86dc-cd0e3310a306.png",
    featured: true
  },
  {
    id: 3,
    title: "Coût réel d'une aide ménagère vs votre temps",
    slug: "cout-aide-menagere-vs-temps",
    description: "Analyse détaillée du coût d'une aide ménagère comparé à la valeur de votre temps personnel et professionnel.",
    excerpt: "Combien vaut réellement votre temps ? Cette analyse vous aidera à prendre la bonne décision financière.",
    category: "Économie",
    readTime: "10 min",
    publishedAt: "2024-01-05",
    author: "Jean Dupont",
    image: "/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png",
    featured: false
  },
  {
    id: 4,
    title: "Sélectionner la meilleure garde d'enfants",
    slug: "selectionner-meilleure-garde-enfants",
    description: "Critères essentiels, questions à poser et conseils pratiques pour choisir la garde d'enfants idéale.",
    excerpt: "Le choix d'une garde d'enfants est crucial. Voici notre guide complet pour faire le bon choix en toute sérénité.",
    category: "Parentalité",
    readTime: "15 min",
    publishedAt: "2024-01-01",
    author: "Claire Rousseau",
    image: "/lovable-uploads/1ac09068-74a1-4d44-bdc6-d342fcb10cd4.png",
    featured: false
  },
  {
    id: 5,
    title: "Comment organiser son planning familial efficacement",
    slug: "organiser-planning-familial",
    description: "Méthodes et outils pour créer un planning familial harmonieux qui fonctionne pour tous.",
    excerpt: "Un planning familial bien organisé est la clé d'un quotidien serein. Découvrez nos méthodes éprouvées.",
    category: "Organisation",
    readTime: "6 min",
    publishedAt: "2023-12-28",
    author: "Marie Lefort",
    image: "/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png",
    featured: false
  },
  {
    id: 6,
    title: "Les bienfaits de la méditation pour les parents",
    slug: "meditation-parents-bienfaits",
    description: "Comment la méditation peut aider les parents à mieux gérer le stress et la charge mentale.",
    excerpt: "Quelques minutes de méditation quotidienne peuvent transformer votre approche de la parentalité.",
    category: "Bien-être",
    readTime: "7 min",
    publishedAt: "2023-12-20",
    author: "Dr. Marie Dubois",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: false
  }
];
