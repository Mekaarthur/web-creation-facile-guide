import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MobileNavigation } from "@/components/MobileNavigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";
import Cart from "@/components/Cart";
import CartIndicator from "@/components/CartIndicator";
import UserProfileMenu from "@/components/UserProfileMenu";
import { servicesData } from "@/utils/servicesData";

const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();

  // Détection du scroll pour effet glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Utiliser le hook pour vérifier les droits admin
  const { isAdmin } = useAdminRole();

  const navItems = [
    { name: "Accueil", href: "/" },
    { name: "À propos", href: "/a-propos-de-nous" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ];

  // Structure organisée des services avec émojis et descriptions
  const servicesCategories = [
    {
      title: "Services Personnel & Famille",
      services: [
        {
          key: "kids",
          name: "Bika Kids",
          icon: "🧸",
          href: "/bika-kids",
          description: "Garde d'enfants et baby-sitting professionnel"
        },
        {
          key: "maison",
          name: "Bika Maison", 
          icon: "🏠",
          href: "/bika-maison",
          description: "Gestion complète de votre foyer"
        },
        {
          key: "seniors",
          name: "Bika Seniors",
          icon: "👴",
          href: "/bika-seniors", 
          description: "Accompagnement personnalisé des seniors"
        },
        {
          key: "animals",
          name: "Bika Animal",
          icon: "🐾",
          href: "/bika-animals",
          description: "Soins et garde de vos animaux"
        }
      ]
    },
    {
      title: "Services Conciergerie & Premium",
      services: [
        {
          key: "vie",
          name: "Bika Vie",
          icon: "🔑",
          href: "/bika-vie",
          description: "Conciergerie complète du quotidien"
        },
        {
          key: "travel",
          name: "Bika Travel",
          icon: "✈️",
          href: "/bika-travel",
          description: "Organisation et assistance voyage"
        },
        {
          key: "pro",
          name: "Bika Pro",
          icon: "💼",
          href: "/bika-pro",
          description: "Services aux entreprises"
        },
        {
          key: "plus",
          name: "Bika Plus",
          icon: "💎",
          href: "/bika-plus",
          description: "Services sur mesure haut de gamme"
        }
      ]
    }
  ];

  const providerItems = [
    { name: "Devenir Prestataire", href: "/devenir-prestataire", icon: "💼", description: "Rejoignez notre réseau" },
    { name: "Espace Prestataire", href: user ? "/espace-prestataire" : "/auth?type=provider", icon: "👤", description: "Accédez à votre espace" },
    { name: "Nous Recrutons", href: "/nous-recrutons", icon: "🚀", description: "Découvrez nos opportunités" }
  ];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-smooth",
      isScrolled 
        ? "bg-white/90 backdrop-blur-lg border-b border-border/50 shadow-elegant" 
        : "bg-white/95 backdrop-blur-md border-b border-border shadow-soft"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" 
                alt="Bikawô Logo" 
                className="h-12 w-auto transition-smooth group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Services Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 hover:text-primary data-[state=open]:bg-muted/50 data-[state=open]:text-primary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[800px] gap-3 p-6 md:grid-cols-2">
                      {servicesCategories.map((category) => (
                        <div key={category.title} className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                            {category.title}
                          </h4>
                          <div className="space-y-1">
                            {category.services.map((service) => (
                              <NavigationMenuLink key={service.key} asChild>
                                <Link
                                  to={service.href}
                                  className="group block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg">{service.icon}</span>
                                    <div>
                                      <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                        {service.name}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {service.description}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Action de fin */}
                      <div className="col-span-2 mt-4 pt-4 border-t border-border">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/services"
                            className="group flex items-center justify-center space-x-2 w-full rounded-lg bg-gradient-primary p-3 text-primary-foreground hover:opacity-90 transition-opacity"
                          >
                            <span>Découvrir tous nos services</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Standard Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-smooth rounded-lg group",
                  "text-foreground hover:text-primary hover:bg-muted/50"
                )}
              >
                {item.name}
                <div className="absolute inset-x-1 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}

            {/* Provider Section */}
            <div className="ml-4 pl-4 border-l border-border">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 hover:text-primary data-[state=open]:bg-muted/50 data-[state=open]:text-primary">
                      💼 Prestataires
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[400px] gap-3 p-4">
                        <div className="space-y-2">
                          {providerItems.map((item) => (
                            <NavigationMenuLink key={item.name} asChild>
                              <Link
                                to={item.href}
                                className="group block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{item.icon}</span>
                                  <div>
                                    <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                      {item.name}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            <CartIndicator onOpenCart={() => setIsCartOpen(true)} />
            <LanguageSwitcher />
            <NotificationCenter />
            
            {user ? (
              <UserProfileMenu userType="client" />
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/services">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Réserver
                  </Button>
                </Link>
                <Link to="/devenir-prestataire">
                  <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                    Devenir Prestataire
                  </Button>
                </Link>
                <div className="h-6 w-px bg-border mx-2" />
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Mobile */}
          <MobileNavigation />
        </div>
      </div>
      
      {/* Panier Modal */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Navbar;