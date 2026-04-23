/**
 * Mobile Bottom Navigation
 * Barre fixe en bas d'écran (mobile only) pour les espaces client & prestataire.
 * Cinq raccourcis contextuels selon le rôle, avec indicateur d'onglet actif.
 */
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  ShoppingCart,
  MessageCircle,
  User,
  Briefcase,
  ListChecks,
  Wallet,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { Badge } from "@/components/ui/badge";

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  matchExact?: boolean;
  query?: string;
}

const buildClientItems = (cartCount: number): BottomNavItem[] => [
  { label: "Accueil", href: "/", icon: Home, matchExact: true },
  { label: "Réservations", href: "/espace-personnel", icon: Calendar, query: "tab=bookings" },
  { label: "Panier", href: "/panier", icon: ShoppingCart, badge: cartCount || undefined },
  { label: "Messages", href: "/espace-personnel", icon: MessageCircle, query: "tab=messages" },
  { label: "Profil", href: "/espace-personnel", icon: User, query: "tab=profile" },
];

const providerItems: BottomNavItem[] = [
  { label: "Accueil", href: "/", icon: Home, matchExact: true },
  { label: "Missions", href: "/espace-prestataire", icon: ListChecks, query: "tab=missions" },
  { label: "Agenda", href: "/espace-prestataire", icon: Calendar, query: "tab=calendar" },
  { label: "Gains", href: "/espace-prestataire", icon: Wallet, query: "tab=billing" },
  { label: "Profil", href: "/espace-prestataire", icon: User, query: "tab=profile" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user, primaryRole } = useAuth();
  const { getCartItemsCount } = useBikawoCart();

  // Affichage limité aux espaces authentifiés (mobile only via classes Tailwind)
  if (!user) return null;
  const onClientSpace = location.pathname.startsWith("/espace-personnel");
  const onProviderSpace = location.pathname.startsWith("/espace-prestataire");
  if (!onClientSpace && !onProviderSpace) return null;

  const isProvider = primaryRole === "provider" || onProviderSpace;
  const items = isProvider ? providerItems : buildClientItems(getCartItemsCount());

  const isActive = (item: BottomNavItem) => {
    if (item.matchExact) return location.pathname === item.href;
    if (!location.pathname.startsWith(item.href)) return false;
    if (!item.query) return true;
    return location.search.includes(item.query);
  };

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-8px_hsl(var(--foreground)/0.15)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item);
          const to = item.query ? `${item.href}?${item.query}` : item.href;
          return (
            <li key={item.label}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.badge ? (
                    <Badge
                      className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] leading-none"
                      variant="destructive"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  ) : null}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
