import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MobileNavigation } from "@/components/MobileNavigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, MessageCircle, Phone, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";
import Cart from "@/components/Cart";
import CartIndicator from "@/components/CartIndicator";
import UserProfileMenu from "@/components/UserProfileMenu";

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  const servicesItems = [
    { name: "Bika Kids", icon: "🧸", href: "/services/bika-kids", description: "Garde d'enfants" },
    { name: "Bika Maison", icon: "🏠", href: "/services/bika-maison", description: "Ménage & entretien" },
    { name: "Bika Vie", icon: "🛒", href: "/services/bika-vie", description: "Courses & démarches" },
    { name: "Bika Travel", icon: "✈️", href: "/services/bika-travel", description: "Assistance voyage" },
    { name: "Bika Plus", icon: "⭐", href: "/services/bika-plus", description: "Services premium" },
    { name: "Bika Animals", icon: "🐾", href: "/services/bika-animals", description: "Garde d'animaux" },
    { name: "Bika Seniors", icon: "👴", href: "/services/bika-seniors", description: "Aide aux seniors" },
    { name: "Bika Pro", icon: "🏢", href: "/services/bika-pro", description: "Solutions entreprises" }
  ];

  const providerItems = [
    { name: "Devenir Prestataire", href: "/devenir-prestataire", icon: "💼" },
    { name: "Espace Prestataire", href: user ? "/espace-prestataire" : "/auth?type=provider", icon: "👤" },
    { name: "Tarifs & Rémunération", href: "/prestataire/tarifs", icon: "💰" },
    { name: "Formation", href: "/prestataire/formation", icon: "🎓" },
    { name: "Postuler Maintenant", href: "/inscription-prestataire", icon: "📋" }
  ];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      isScrolled 
        ? "bg-white/80 backdrop-blur-lg border-b border-border/50 shadow-sm" 
        : "bg-white/95 backdrop-blur-sm border-b border-border shadow-glow"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <Link to="/">
              <img 
                src="/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" 
                alt="Bikawô Logo" 
                className="h-12 w-auto transition-all duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Services Mega Menu */}
            <div 
              className="relative"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <Button 
                variant="ghost" 
                className={cn(
                  "relative px-2 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                  "text-foreground hover:text-primary whitespace-nowrap"
                )}
              >
                Services
                <ChevronDown className="ml-1 h-4 w-4 flex-shrink-0" />
                <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
              </Button>

              {/* Mega Menu */}
              {showMegaMenu && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[800px] bg-white/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-xl p-6 z-50">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">SERVICES BIKAWO</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    {/* Services Pour Vos Besoins */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        🛒 POUR VOS BESOINS
                      </h4>
                      <div className="space-y-2">
                        {servicesItems.map((service) => (
                          <Link
                            key={service.name}
                            to={service.href}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            onClick={() => setShowMegaMenu(false)}
                          >
                            <span className="text-xl mr-3">{service.icon}</span>
                            <div>
                              <div className="font-medium text-foreground group-hover:text-primary">
                                {service.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {service.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        <Link
                          to="/services"
                          className="flex items-center p-3 mt-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium"
                          onClick={() => setShowMegaMenu(false)}
                        >
                          📖 Voir tous nos services
                        </Link>
                      </div>
                    </div>

                    {/* Rejoignez-Nous */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        💼 REJOIGNEZ-NOUS
                      </h4>
                      <div className="space-y-2">
                        {providerItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            onClick={() => setShowMegaMenu(false)}
                          >
                            <span className="text-xl mr-3">{item.icon}</span>
                            <div className="font-medium text-foreground group-hover:text-primary">
                              {item.name}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative px-2 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                  "text-foreground hover:text-primary whitespace-nowrap"
                )}
              >
                {item.name}
                <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Panier uniquement pour les clients */}
            {(!user || user) && <CartIndicator onOpenCart={() => setIsCartOpen(true)} />}

            <LanguageSwitcher />
            <NotificationCenter />
            
            {user ? (
              <UserProfileMenu userType="client" />
            ) : (
              /* Bouton Split Réserver | Devenir Prestataire */
              <div className="flex divide-x divide-border border border-border rounded-lg overflow-hidden">
                <Link to="/services">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none border-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    🛒 Réserver
                  </Button>
                </Link>
                <Link to="/devenir-prestataire">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none border-0 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    💼 Devenir Prestataire
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Mobile */}
          <MobileNavigation />
        </div>
      </div>
      
      {/* Overlay pour fermer le mega menu */}
      {showMegaMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMegaMenu(false)}
        />
      )}
      
      {/* Panier Modal */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Navbar;