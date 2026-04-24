import { Outlet, Link, useLocation } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useAdminCounts } from "@/hooks/useAdminCounts";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Users,
  UserCheck,
  Target,
  Euro,
  Activity,
  Settings,
  Palette,
  Bell,
  Shield,
  MessageSquare,
  Calendar,
  MapPin,
  AlertTriangle,
  CreditCard,
  FileText,
  PieChart,
  Gift,
  MessageSquareWarning,
  Landmark,
  Zap,
  Star,
  CheckSquare,
  Flag,
  FlaskConical,
  Lock,
  Mail,
  TrendingUp,
  UserCog,
  Clock
} from "lucide-react";
import { NotificationBell } from './NotificationBell';
import { SecureLogout } from '@/components/SecureLogout';
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Vue d'ensemble",
    items: [
      { title: "Dashboard",    href: "/modern-admin",            icon: BarChart3 },
      { title: "Analytics",    href: "/modern-admin/analytics",  icon: PieChart },
      { title: "Temps Réel",   href: "/modern-admin/realtime",   icon: Activity },
    ]
  },
  {
    label: "Sécurité & Finance",
    items: [
      { title: "Sécurité",       href: "/modern-admin/security",       icon: Lock },
      { title: "Finance",        href: "/modern-admin/finance",         icon: Euro },
      { title: "Urgences",       href: "/modern-admin/urgences",        icon: AlertTriangle },
      { title: "Réclamations",   href: "/modern-admin/reclamations",    icon: MessageSquareWarning },
    ]
  },
  {
    label: "Gestion Business",
    items: [
      { title: "Utilisateurs",  href: "/modern-admin/utilisateurs",  icon: UserCog,   countKey: null },
      { title: "Clients",       href: "/modern-admin/clients",       icon: Users,     countKey: null },
      { title: "Prestataires",  href: "/modern-admin/providers",     icon: UserCheck, countKey: "prestatairesPending" as const },
      { title: "Candidatures",  href: "/modern-admin/applications",  icon: FileText,  countKey: "candidatures" as const },
      { title: "Binômes",       href: "/modern-admin/binomes",       icon: Star,      countKey: null },
      { title: "Cooptation",    href: "/modern-admin/cooptation",    icon: Gift,      countKey: null },
    ]
  },
  {
    label: "Automatisation",
    items: [
      { title: "Onboarding",   href: "/modern-admin/onboarding", icon: CheckSquare },
      { title: "Matching IA",  href: "/modern-admin/matching",   icon: Zap },
    ]
  },
  {
    label: "Opérations",
    items: [
      { title: "Missions",          href: "/modern-admin/missions",            icon: Target,    countKey: "missionsPending" as const },
      { title: "Réservations",      href: "/modern-admin/reservations",        icon: Calendar,  countKey: null },
      { title: "Paiements",         href: "/modern-admin/payments",            icon: CreditCard,countKey: null },
      { title: "Factures",          href: "/modern-admin/invoices",            icon: FileText,  countKey: null },
      { title: "Avance Immédiate",  href: "/modern-admin/urssaf-declarations", icon: Landmark,  countKey: null },
    ]
  },
  {
    label: "Communication",
    items: [
      { title: "Messages",       href: "/modern-admin/messages",       icon: MessageSquare, countKey: "messages" as const },
      { title: "Notifications",  href: "/modern-admin/notifications",  icon: Bell,          countKey: null },
      { title: "Avis & Notes",   href: "/modern-admin/reviews",        icon: Star,          countKey: "moderation" as const },
    ]
  },
  {
    label: "Modération",
    items: [
      { title: "Alertes",       href: "/modern-admin/alerts",   icon: AlertTriangle, countKey: "alerts" as const },
      { title: "Signalements",  href: "/modern-admin/reports",  icon: Flag,          countKey: null },
      { title: "Qualité",       href: "/modern-admin/quality",  icon: CheckSquare,   countKey: null },
    ]
  },
  {
    label: "Configuration",
    items: [
      { title: "Zones",        href: "/modern-admin/zones",          icon: MapPin },
      { title: "Marque",       href: "/modern-admin/marque",         icon: Palette },
      { title: "Paramètres",   href: "/modern-admin/settings",       icon: Settings },
      { title: "Rapports",     href: "/modern-admin/reports-data",   icon: TrendingUp },
    ]
  },
  {
    label: "Tests & Systèmes",
    items: [
      { title: "Anomalies",        href: "/modern-admin/anomalies",        icon: AlertTriangle },
      { title: "Monitoring",       href: "/modern-admin/monitoring",        icon: Activity },
      { title: "Tests Critiques",  href: "/modern-admin/tests-critiques",  icon: FlaskConical },
      { title: "Tests Emails",     href: "/modern-admin/tests-emails",     icon: Mail },
      { title: "Accès Admin",      href: "/modern-admin/acces",            icon: Clock },
    ]
  }
];

type CountKey = "prestatairesPending" | "candidatures" | "missionsPending" | "messages" | "moderation" | "alerts";

function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: counts } = useAdminCounts();

  const isActive = (href: string) => {
    if (href === '/modern-admin') {
      return location.pathname === '/modern-admin' || location.pathname === '/modern-admin/';
    }
    return location.pathname === href;
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-4 mb-4 border-b">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg">Bikawo Admin</h2>
              <p className="text-xs text-muted-foreground">Interface d'administration</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const countKey = (item as any).countKey as CountKey | null;
                  const badgeCount = countKey && counts ? counts[countKey] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                            "hover:bg-accent hover:text-accent-foreground",
                            active && "bg-primary text-primary-foreground font-medium"
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {badgeCount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0 min-w-[18px] text-center"
                                >
                                  {badgeCount}
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

export default function ModernAdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-auto min-h-[56px] sm:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-0 h-full gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <SidebarTrigger />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-xl font-semibold truncate">Administration Bikawo</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gérez votre plateforme en temps réel</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                <NotificationBell />

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Admin</span>
                </div>

                <SecureLogout
                  variant="outline"
                  size="sm"
                  showIcon={true}
                />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
