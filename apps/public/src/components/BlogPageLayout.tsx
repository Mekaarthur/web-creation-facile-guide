import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Calendar, User, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Composant pour image lazy load avec skeleton
const LazyBlogImage = ({ src, alt, category }: { src: string; alt: string; category: string }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img 
        src={src} 
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute top-3 left-3">
        <Badge variant="secondary" className="bg-white/90 text-foreground">
          {category}
        </Badge>
      </div>
    </div>
  );
};

interface BlogPost {
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

interface BlogPageLayoutProps {
  title: string;
  subtitle: string;
  categories: string[];
  featuredPosts: BlogPost[];
  allPosts: BlogPost[];
  heroImage?: string;
}

const BlogPageLayout = ({ 
  title, 
  subtitle, 
  categories, 
  featuredPosts, 
  allPosts, 
  heroImage 
}: BlogPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Style Wecasa */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 lg:py-28 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-white space-y-8 order-2 lg:order-1">
              <div>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                  {title}
                </h1>
                <p className="text-xl lg:text-2xl text-white/90 font-medium leading-relaxed">
                  {subtitle}
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input 
                      placeholder="Rechercher un article..."
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                    />
                  </div>
                  <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Rechercher
                  </Button>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">Parcourir par catégorie</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.slice(1).map((category) => (
                    <Badge 
                      key={category} 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer px-4 py-2 text-sm font-medium"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Featured Image or Illustration */}
            <div className="relative order-1 lg:order-2">
              {heroImage ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={heroImage} 
                    alt="Blog Hero"
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-full h-80 lg:h-96 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">📚</div>
                      <p className="text-lg font-medium">Découvrez nos conseils</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles - Style Magazine */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-12 text-center">
            Articles à la une
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {featuredPosts.map((post, index) => (
              <Card key={post.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay avec catégorie */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white px-3 py-1 font-semibold">
                      {post.category}
                    </Badge>
                  </div>
                  {/* Overlay avec titre et info - Style Wecasa */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl lg:text-2xl font-bold mb-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-white/90 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-white/80">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                        <Button size="sm" variant="secondary" asChild>
                          <Link to={`/blog/${post.slug}`}>
                            Lire l'article
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Content */}
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.readTime} de lecture
                      </div>
                      <Button variant="ghost" size="sm" asChild className="group/btn">
                        <Link to={`/blog/${post.slug}`}>
                          Lire plus 
                          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Articles Grid */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-12 text-center">
            Tous nos articles
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPosts.map((post) => (
              <Card key={post.id} className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-background">
                <LazyBlogImage src={post.image} alt={post.title} category={post.category} />
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.readTime}
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        Par {post.author}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/blog/${post.slug}`}>
                          Lire <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-0 shadow-xl bg-gradient-to-r from-primary to-primary/80 text-white overflow-hidden">
            <div className="relative p-8 lg:p-12">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative text-center">
                <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                  Suivez-Nous
                </h3>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Recevez nos meilleurs conseils et astuces directement dans votre boîte mail chaque semaine
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input 
                    type="email" 
                    placeholder="Votre adresse email"
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                  />
                  <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 px-8">
                    S'abonner
                  </Button>
                </div>
                
                <p className="text-sm text-white/70 mt-4">
                  Pas de spam, désabonnement en un clic
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default BlogPageLayout;