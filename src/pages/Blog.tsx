import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const blogPosts = [
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
  }
];

const categories = ["Tous", "Bien-être", "Organisation", "Économie", "Parentalité"];

const Blog = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-subtle py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Blog BIKAWO
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Conseils pratiques, astuces d'organisation et guides pour simplifier votre quotidien familial
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-8">Articles à la une</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {blogPosts.filter(post => post.featured).map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                    <CardDescription className="text-base">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                        <Calendar className="w-4 h-4 ml-4 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/blog/${post.slug}`}>
                          Lire plus <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* All Posts */}
        <section className="py-16 bg-muted/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-8">Tous les articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-lg hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Par {post.author}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/blog/${post.slug}`}>
                          Lire <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Restez informé de nos derniers conseils
              </h3>
              <p className="text-muted-foreground mb-6">
                Recevez chaque semaine nos meilleurs articles directement dans votre boîte mail
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button>S'abonner</Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;