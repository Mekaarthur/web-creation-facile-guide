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
    description: "L'histoire personnelle d'Anita, co-fondatrice de BIKAWO, et comment la charge mentale a façonné notre mission d'aider les familles à retrouver leur équilibre.",
    excerpt: "Cette galère invisible qui nous épuise tous. L'histoire vraie d'une maman au bord du gouffre et la naissance d'une solution concrète pour des milliers de familles.",
    category: "Bien-être",
    readTime: "15 min",
    publishedAt: "2025-01-18",
    author: "Anita - Co-fondatrice BIKAWO",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png",
    featured: true
  }
];
