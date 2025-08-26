import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Home, 
  Briefcase, 
  User, 
  Settings, 
  HelpCircle,
  Phone,
  Star,
  Calendar,
  MessageCircle,
  Bell,
  CreditCard,
  FileText,
  Shield,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/components/Cart";

interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

const publicNavItems: MobileNavItem[] = [
  {
    title: "Accueil",
    href: "/",
    icon: Home,
    description: "Retour à l'accueil"
  },
  {
    title: "Nos services",
    href: "/services",
    icon: Briefcase,
    description: "Nos services disponibles"
  },
  {
    title: "À propos",
    href: "/a-propos-de-nous",
    icon: Star,
    description: "En savoir plus sur nous"
  },
  {
    title: "Contact",
    href: "/contact",
    icon: Phone,
    description: "Nous contacter"
  }
];

const getClientNavItems = (cartCount: number): MobileNavItem[] => [
  {
    title: "Mon espace",
    href: "/espace-personnel",
    icon: User,
    description: "Tableau de bord client"
  },
  {
    title: "Mes réservations",
    href: "/espace-personnel",
    icon: Calendar,
    description: "Gérer mes réservations"
  },
  {
    title: "Mon panier",
    href: "/espace-personnel?tab=panier",
    icon: ShoppingCart,
    badge: cartCount > 0 ? cartCount.toString() : undefined,
    description: "Mes services sélectionnés"
  },
  {
    title: "Factures",
    href: "/espace-personnel",
    icon: FileText,
    description: "Historique des factures"
  },
  {
    title: "Notifications",
    href: "/espace-personnel",
    icon: Bell,
    badge: "2",
    description: "Centre de notifications"
  }
];

const providerNavItems: MobileNavItem[] = [
  {
    title: "Mon espace",
    href: "/espace-prestataire",
    icon: Briefcase,
    description: "Tableau de bord prestataire"
  },
  {
    title: "Mes missions",
    href: "/espace-prestataire",
    icon: Calendar,
    description: "Gérer mes missions"
  },
  {
    title: "Messages",
    href: "/espace-prestataire",
    icon: MessageCircle,
    badge: "1",
    description: "Conversations avec clients"
  },
  {
    title: "Paiements",
    href: "/espace-prestataire",
    icon: CreditCard,
    description: "Historique des gains"
  },
  {
    title: "Disponibilités",
    href: "/espace-prestataire",
    icon: Settings,
    description: "Gérer mes créneaux"
  }
];

const adminNavItems: MobileNavItem[] = [
  {
    title: "Administration",
    href: "/admin-system",
    icon: Shield,
    description: "Panneau d'administration"
  },
  {
    title: "Prestataires",
    href: "/admin-system",
    icon: User,
    badge: "5",
    description: "Validation des prestataires"
  },
  {
    title: "Demandes",
    href: "/gestion-demandes",
    icon: FileText,
    description: "Gestion des demandes"
  }
];

export const MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { getCartItemsCount } = useCart();

  // Déterminer le type d'utilisateur et les éléments de navigation
  const getUserNavItems = () => {
    const currentPath = location.pathname;
    const cartCount = getCartItemsCount();
    
    if (currentPath.startsWith('/admin')) {
      return [...publicNavItems, ...adminNavItems];
    }
    
    if (currentPath.startsWith('/espace-prestataire')) {
      return [...publicNavItems, ...providerNavItems];
    }
    
    if (currentPath.startsWith('/espace-personnel') && user) {
      return [...publicNavItems, ...getClientNavItems(cartCount)];
    }
    
    return publicNavItems;
  };

  const navItems = getUserNavItems();

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 transition-all duration-200 hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Bikawo</h2>
                  <p className="text-xs text-muted-foreground">Services à domicile</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
              <div className="space-y-1 px-3">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 group animate-fade-in-up",
                      isActiveLink(item.href)
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-l-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActiveLink(item.href) 
                        ? "text-primary" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="h-5 px-1.5 text-xs bg-primary/20 text-primary animate-pulse-soft"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border/50">
              {user ? (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Connecté</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button className="w-full" size="sm">
                      Connexion
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground">
                    Rejoignez la communauté Bikawo
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};