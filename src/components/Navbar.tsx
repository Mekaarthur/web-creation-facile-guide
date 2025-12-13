import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { ChevronDown, Sparkles, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";
import BikawoCart from "@/components/BikawoCart";
import BikawoCartIndicator from "@/components/BikawoCartIndicator";
import UserProfileMenu from "@/components/UserProfileMenu";
import { SecureLogout } from "@/components/SecureLogout";
import { servicesData } from "@/utils/servicesData";
import { GlobalSearch } from "@/components/search/GlobalSearch";
// Use optimized logo from public folder (~15KB vs 766KB)
const bikawoLogo = "/logo-small.webp";
// Import service images
import serviceKids from '@/assets/service-kids.jpg';
import serviceMaison from '@/assets/service-maison.jpg';
import serviceSeniors from '@/assets/service-seniors.jpg';
import serviceAnimals from '@/assets/service-animals.jpg';
import serviceAdmin from '@/assets/service-admin.jpg';
import serviceTravel from '@/assets/service-travel.jpg';
import serviceBusiness from '@/assets/service-business.jpg';
import servicePremium from '@/assets/service-premium.jpg';

const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, primaryRole } = useAuth();
  const location = useLocation();

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
    { name: t('nav.about'), href: "/a-propos-de-nous", label: "nav.about" },
    { name: t('nav.contact'), href: "/contact", label: "nav.contact" },
    { name: t('nav.blog'), href: "/blog", label: "nav.blog" },
  ];

  // Structure organisée des services avec images
  const servicesCategories = [
    {
      title: "Services Personnel & Famille",
      services: [
        {
          key: "kids",
          name: "Bika Kids",
          image: serviceKids,
          href: "/bika-kids",
          description: "Garde d'enfants et baby-sitting professionnel"
        },
        {
          key: "maison",
          name: "Bika Maison", 
          image: serviceMaison,
          href: "/bika-maison",
          description: "Gestion complète de votre foyer"
        },
        {
          key: "seniors",
          name: "Bika Seniors",
          image: serviceSeniors,
          href: "/bika-seniors", 
          description: "Accompagnement personnalisé des seniors"
        },
        {
          key: "animals",
          name: "Bika Animal",
          image: serviceAnimals,
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
          image: serviceAdmin,
          href: "/bika-vie",
          description: "Conciergerie complète du quotidien"
        },
        {
          key: "travel",
          name: "Bika Travel",
          image: serviceTravel,
          href: "/bika-travel",
          description: "Organisation et assistance voyage"
        },
        {
          key: "pro",
          name: "Bika Pro",
          image: serviceBusiness,
          href: "/bika-pro",
          description: "Services aux entreprises"
        },
        {
          key: "plus",
          name: "Bika Plus",
          image: servicePremium,
          href: "/bika-plus",
          description: "Services sur mesure haut de gamme"
        }
      ]
    }
  ];

  const providerItems = [
    { name: "Espace Prestataire", href: user ? "/espace-prestataire" : "/auth?type=provider", icon: "👤", description: "Accédez à votre espace" },
    { name: "Nous Recrutons", href: "/nous-recrutons", icon: "🚀", description: "Découvrez nos opportunités" }
  ];

  return (
    <>
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
                src={bikawoLogo} 
                alt="Bikawô Logo" 
                className="h-10 sm:h-12 w-auto bg-transparent transition-smooth group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Accueil Link */}
            <Link
              to="/"
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-smooth rounded-lg group",
                "text-foreground hover:text-primary hover:bg-muted/50"
              )}
            >
              {t('nav.home')}
              <div className="absolute inset-x-1 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
            </Link>

            {/* Services Navigation Menu */}
            <NavigationMenu data-tutorial="services">
              <NavigationMenuList>
                <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 hover:text-primary data-[state=open]:bg-muted/50 data-[state=open]:text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('nav.services')}
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
                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                      <img 
                                        src={service.image} 
                                        alt={service.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
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
                  "relative px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-smooth rounded-lg group",
                  location.pathname === item.href 
                    ? "text-primary font-bold bg-muted/50" 
                    : "text-foreground hover:text-primary hover:bg-muted/50"
                )}
              >
                {item.name}
                {location.pathname === item.href && (
                  <div className="absolute inset-x-1 -bottom-1 h-0.5 bg-gradient-primary rounded-full" />
                )}
                {location.pathname !== item.href && (
                  <div className="absolute inset-x-1 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            <GlobalSearch />
            <BikawoCartIndicator onOpenCart={() => setIsCartOpen(true)} showTotal />
            <LanguageSwitcher />
            <NotificationCenter />
            
            {user ? (
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to={primaryRole === 'provider' ? '/espace-prestataire' : '/espace-personnel'}>
                  <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                    <User className="mr-1 h-3 w-3" />
                    Mon compte
                  </Button>
                </Link>
                <SecureLogout variant="outline" size="sm" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/services">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {t('cta.book')}
                  </Button>
                </Link>
                <Link to="/nous-recrutons">
                  <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground border-primary/20 text-primary hover:border-primary">
                    {t('cta.becomeProvider')}
                  </Button>
                </Link>
                <div className="h-6 w-px bg-border mx-2" />
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                    {t('auth.login')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <BikawoCartIndicator onOpenCart={() => setIsCartOpen(true)} className="mr-1" />
            <MobileNavigation />
          </div>
        </div>
      </div>
      
    </nav>
    {/* Panier Modal - rendu hors du nav pour conserver le scroll */}
    <BikawoCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;