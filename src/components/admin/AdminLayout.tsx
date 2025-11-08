import { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
  Bell,
  FileText,
  Building2,
  Heart,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCounts } from "@/hooks/useAdminCounts";

const navigationGroupsStatic = [
  {
    title: 'Vue d\'ensemble',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: null },
      // Badge remplacé dynamiquement
      { name: 'Alertes', href: '/admin/alertes', icon: AlertTriangle, badge: null },
    ]
  },
  {
    title: 'Gestion des missions',
    items: [
      { name: 'Kanban', href: '/admin/kanban', icon: Calendar, badge: null },
      // Badges remplacés dynamiquement
      { name: 'Demandes', href: '/admin/demandes', icon: FileText, badge: null },
      { name: 'Candidatures', href: '/admin/candidatures', icon: UserCheck, badge: null },
    ]
  },
  {
    title: 'Utilisateurs',
    items: [
      { name: 'Clients', href: '/admin/utilisateurs', icon: Users, badge: null },
      // Badge remplacé dynamiquement
      { name: 'Prestataires', href: '/admin/prestataires', icon: Building2, badge: null },
      { name: 'Binômes', href: '/admin/binomes', icon: Heart, badge: null },
    ]
  },
  {
    title: 'Communication',
    items: [
      // Badge remplacé dynamiquement
      { name: 'Messagerie', href: '/admin/messagerie', icon: MessageSquare, badge: null },
      { name: 'Messages & Emails', href: '/admin/messages', icon: MessageSquare, badge: null },
      { name: 'Tests Emails', href: '/admin/tests-emails', icon: MessageSquare, badge: null },
      { name: 'Communications', href: '/admin/communications', icon: Send, badge: null },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, badge: null },
    ]
  },
  {
    title: 'Urgences & Modération',
    items: [
      { name: 'Urgences', href: '/admin/urgences', icon: AlertTriangle, badge: null },
      { name: 'Modération', href: '/admin/moderation', icon: Shield, badge: null },
    ]
  },
  {
    title: 'Finance & Configuration',
    items: [
        { name: 'Paiements', href: '/admin/paiements', icon: CreditCard, badge: null },
        { name: 'Factures clients', href: '/admin/factures', icon: FileText, badge: null },
        { name: 'Fiches rémunération', href: '/admin/remunerations', icon: Building2, badge: null },
        { name: 'Audit Qualité', href: '/admin/audit', icon: Shield, badge: null },
        { name: 'Zones', href: '/admin/zones', icon: MapPin, badge: null },
        { name: 'Statistiques', href: '/admin/statistiques', icon: BarChart3, badge: null },
        { name: 'Paramètres', href: '/admin/parametres', icon: Settings, badge: null },
    ]
  }
];

export const AdminLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

// Ouvrir automatiquement le groupe contenant la page active
useEffect(() => {
  const currentPath = location.pathname;
  const activeGroup = navigationGroupsStatic.find(group =>
    group.items.some(item => item.href === currentPath)
  );
  if (activeGroup && !openGroups.includes(activeGroup.title)) {
    setOpenGroups(prev => [...prev, activeGroup.title]);
  }
}, [location.pathname, openGroups]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };


  // Compteurs dynamiques via hook
  const { data: counts = {
    alerts: 0,
    demandes: 0,
    candidatures: 0,
    prestatairesPending: 0,
    moderation: 0,
    messages: 0,
  }, refetch } = useAdminCounts();

  useEffect(() => {
    const channel = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_messages' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Groupes de navigation dynamiques
  const navigationGroups = [
    {
      title: 'Vue d\'ensemble',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: null },
        { name: 'Alertes', href: '/admin/alertes', icon: AlertTriangle, badge: counts.alerts || null },
      ]
    },
    {
      title: 'Gestion des missions',
      items: [
        { name: 'Kanban', href: '/admin/kanban', icon: Calendar, badge: null },
        { name: 'Demandes', href: '/admin/demandes', icon: FileText, badge: counts.demandes || null },
        { name: 'Candidatures', href: '/admin/candidatures', icon: UserCheck, badge: counts.candidatures || null },
      ]
    },
    {
      title: 'Utilisateurs',
      items: [
        { name: 'Clients', href: '/admin/utilisateurs', icon: Users, badge: null },
        { name: 'Prestataires', href: '/admin/prestataires', icon: Building2, badge: counts.prestatairesPending || null },
        { name: 'Binômes', href: '/admin/binomes', icon: Heart, badge: null },
        { name: 'Modération', href: '/admin/moderation', icon: Shield, badge: counts.moderation || null },
      ]
    },
    {
      title: 'Communication',
      items: [
        { name: 'Messagerie', href: '/admin/messagerie', icon: MessageSquare, badge: counts.messages || null },
        { name: 'Messages & Emails', href: '/admin/messages', icon: MessageSquare, badge: null },
        { name: 'Tests Emails', href: '/admin/tests-emails', icon: MessageSquare, badge: null },
        { name: 'Notifications', href: '/admin/notifications', icon: Bell, badge: null },
      ]
    },
    {
      title: 'Finance & Configuration',
      items: [
      { name: 'Paiements', href: '/admin/paiements', icon: CreditCard, badge: null },
      { name: 'Factures clients', href: '/admin/factures', icon: FileText, badge: null },
      { name: 'Fiches rémunération', href: '/admin/remunerations', icon: Building2, badge: null },
      { name: 'Audit Qualité', href: '/admin/audit', icon: Shield, badge: null },
      { name: 'Zones', href: '/admin/zones', icon: MapPin, badge: null },
      { name: 'Statistiques', href: '/admin/statistiques', icon: BarChart3, badge: null },
      { name: 'Paramètres', href: '/admin/parametres', icon: Settings, badge: null },
      ]
    }
  ];

  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <ScrollArea className="h-full">
      <div className={cn("space-y-2", mobile && "px-4")}> 
        {navigationGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.includes(group.title)}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {group.title}
              {openGroups.includes(group.title) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => mobile && setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2 ml-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </div>
                    {item.badge ? (
                      <Badge 
                        variant={item.badge > 5 ? "destructive" : "secondary"} 
                        className="ml-auto text-xs"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </ScrollArea>
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
        <aside className="hidden lg:block w-64 xl:w-72 border-r bg-background/95 shadow-sm">
          <nav className="h-full p-3 xl:p-4">
            <NavigationItems />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};