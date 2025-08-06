import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Menu, X, MessageCircle, Phone, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Accueil", href: "/" },
    { name: "Nos services", href: "/services" },
    { name: "À propos", href: "/a-propos-de-nous" },
    { name: "Espace client", href: "/espace-personnel" },
    { name: "Espace prestataire", href: "/espace-prestataire" },
    { name: "Gestion demandes", href: "/gestion-demandes" },
    { name: "Nous recrutons", href: "/nous-recrutons" },
    { name: "Aide", href: "/aide" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-border z-50 shadow-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png" 
              alt="Bikawô Logo" 
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              item.href.startsWith('/#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-all duration-300 font-semibold text-base tracking-wide hover:scale-105"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-foreground hover:text-primary transition-all duration-300 font-semibold text-base tracking-wide hover:scale-105"
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('tel:0609085390', '_self')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Appeler
            </Button>
            {user ? (
              <div className="flex items-center space-x-2">
                <NotificationCenter />
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
                Connexion
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden mobile-menu bg-white border-t border-border animate-fade-in">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              item.href.startsWith('/#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="mobile-nav-item block px-3 py-3 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="mobile-nav-item block px-3 py-3 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}
            <div className="pt-4 space-y-3">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full min-h-[48px]"
                onClick={() => window.open('tel:0609085390', '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler
              </Button>
              {user ? (
                <Button variant="outline" size="lg" className="w-full min-h-[48px]" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              ) : (
                <Button variant="hero" size="lg" className="w-full min-h-[48px]" onClick={() => navigate("/auth")}>
                  Connexion
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;