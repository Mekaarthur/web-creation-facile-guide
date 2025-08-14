import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar,
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  MapPin,
  Shield,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Alertes', href: '/admin/alertes', icon: AlertTriangle },
  { name: 'Kanban', href: '/admin/kanban', icon: Calendar },
  { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { name: 'Prestataires', href: '/admin/prestataires', icon: UserCheck },
  { name: 'Demandes', href: '/admin/demandes', icon: Calendar },
  { name: 'Candidatures', href: '/admin/candidatures', icon: UserCheck },
  { name: 'Modération', href: '/admin/moderation', icon: Shield },
  { name: 'Messagerie', href: '/admin/messagerie', icon: MessageSquare },
  { name: 'Paiements', href: '/admin/paiements', icon: CreditCard },
  { name: 'Zones', href: '/admin/zones', icon: MapPin },
  { name: 'Statistiques', href: '/admin/statistiques', icon: BarChart3 },
  { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
];

export const AdminLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("space-y-1", mobile && "px-4")}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
            {item.name === 'Modération' && (
              <Badge variant="destructive" className="ml-auto">
                3
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
              </div>
              <nav className="mt-4">
                <NavigationItems mobile />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop title */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Administration</h1>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Administrateur
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-background/95">
          <nav className="p-4">
            <NavigationItems />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};