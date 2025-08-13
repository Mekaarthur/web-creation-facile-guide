import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MobileNavigation } from "@/components/MobileNavigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, X, MessageCircle, Phone, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
    { name: "Nos services", href: "/services" },
    { name: "À propos", href: "/a-propos-de-nous" },
    { name: "Espace client", href: "/espace-personnel" },
    { name: "Espace prestataire", href: "/espace-prestataire" },
    ...(isAdmin ? [
      { name: "Candidatures", href: "/admin/candidatures" },
      { name: "Demandes clients", href: "/admin/demandes" },
      { name: "Gestion demandes", href: "/gestion-demandes" }
    ] : []),
    { name: "Nous recrutons", href: "/nous-recrutons" },
    { name: "Contact", href: "/contact" },
    { name: "Aide", href: "/aide" },
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
            <img 
              src="/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" 
              alt="Bikawô Logo" 
              className="h-12 w-auto transition-all duration-300 group-hover:scale-105"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              item.href.startsWith('/#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                    "text-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                  <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                    "text-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                  <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              )
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher />
            <NotificationCenter />
            
            {user ? (
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive/90 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="transition-all duration-200 hover:bg-primary/10">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="transition-all duration-200 hover:scale-105">
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Mobile */}
          <MobileNavigation />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;