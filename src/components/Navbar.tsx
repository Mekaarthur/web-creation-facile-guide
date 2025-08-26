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
    { 
      name: "Nos services", 
      href: "/services",
      submenu: [
        { name: "Bika Kids - Enfants", href: "/bika-kids-ile-de-france" },
        { name: "Bika Maison - Logistique", href: "/bika-maison-ile-de-france" },
        { name: "Bika Vie - Conciergerie", href: "/bika-vie-ile-de-france" },
        { name: "Bika Travel - Voyageurs", href: "/bika-travel-ile-de-france" },
        { name: "Bika Plus - Premium", href: "/bika-plus-ile-de-france" },
        { name: "Bika Animals - Animaux", href: "/bika-animals-ile-de-france" },
        { name: "Bika Seniors - Personnes âgées", href: "/bika-seniors-ile-de-france" },
        { name: "Bika Pro - Entreprises", href: "/bika-pro-ile-de-france" }
      ]
    },
    { name: "À propos", href: "/a-propos-de-nous" },
    { name: "Contact", href: "/contact" },
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
          <div className="hidden lg:flex items-center space-x-4">
            {navItems.map((item) => (
              item.submenu ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "relative px-2 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                        "text-foreground hover:text-primary whitespace-nowrap"
                      )}
                    >
                      {item.name}
                      <ChevronDown className="ml-1 h-4 w-4 flex-shrink-0" />
                      <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary rounded-full scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-background border z-50 shadow-lg">
                    {item.submenu.map((subItem) => (
                      <DropdownMenuItem key={subItem.name} asChild>
                        <Link 
                          to={subItem.href}
                          className="w-full cursor-pointer text-foreground hover:bg-muted"
                        >
                          {subItem.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : item.href.startsWith('/#') ? (
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
                    "relative px-2 py-2 text-sm font-medium transition-all duration-200 rounded-md group",
                    "text-foreground hover:text-primary whitespace-nowrap"
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
            {/* Indicateur Panier */}
            <CartIndicator onOpenCart={() => setIsCartOpen(true)} />

            <LanguageSwitcher />
            <NotificationCenter />
            
            {user ? (
              <UserProfileMenu userType="client" />
            ) : (
              <Link to="/auth">
                <Button size="sm" className="transition-all duration-200 hover:scale-105">
                  Connexion
                </Button>
              </Link>
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