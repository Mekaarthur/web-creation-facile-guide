import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
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
  TrendingUp, 
  Settings,
  Palette,
  Wrench,
  Bell,
  Shield,
  MessageSquare,
  Calendar,
  MapPin,
  AlertTriangle,
  CreditCard,
  FileText,
  PieChart,
  Gift
} from "lucide-react";
import { Mail } from "lucide-react";
import { NotificationBell } from './NotificationBell';
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Vue d'ensemble",
    items: [
      { 
        title: "Dashboard", 
        href: "/modern-admin/dashboard", 
        icon: BarChart3,
        badge: null
      },
      { 
        title: "Analytics", 
        href: "/modern-admin/analytics", 
        icon: PieChart,
        badge: null
      },
      { 
        title: "Temps Réel", 
        href: "/modern-admin/realtime", 
        icon: TrendingUp,
        badge: null
      }
    ]
  },
  {
    label: "Vue Technique",
    description: "Gestion des comptes et authentification",
    items: [
      { 
        title: "Utilisateurs", 
        href: "/modern-admin/clients", 
        icon: Users,
        badge: null
      }
    ]
  },
  {
    label: "Gestion Business",
    description: "Suivi clients, prestataires et relations commerciales",
    items: [
      { 
        title: "Clients", 
        href: "/modern-admin/clients", 
        icon: Users,
        badge: null
      },
      { 
        title: "Prestataires", 
        href: "/modern-admin/providers", 
        icon: UserCheck,
        badge: null
      },
      { 
        title: "Candidatures", 
        href: "/modern-admin/applications", 
        icon: FileText,
        badge: null
      },
      { 
        title: "Binômes", 
        href: "/modern-admin/binomes", 
        icon: Gift,
        badge: null
      }
    ]
  },
  {
    label: "Automatisation",
    description: "Outils intelligents et automatisation",
    items: [
      { 
        title: "Onboarding", 
        href: "/modern-admin/onboarding", 
        icon: Target,
        badge: null
      },
      { 
        title: "Matching IA", 
        href: "/modern-admin/matching", 
        icon: TrendingUp,
        badge: null
      }
    ]
  },
  {
    label: "Opérations",
    description: "Missions, réservations et facturation",
    items: [
      { 
        title: "Missions", 
        href: "/modern-admin/missions", 
        icon: Target,
        badge: null
      },
      { 
        title: "Réservations", 
        href: "/modern-admin/reservations", 
        icon: Calendar,
        badge: null
      },
      { 
        title: "Paiements", 
        href: "/modern-admin/payments", 
        icon: CreditCard,
        badge: null
      },
      { 
        title: "Factures", 
        href: "/modern-admin/invoices", 
        icon: FileText,
        badge: null
      }
    ]
  },
  {
    label: "Modération",
    description: "Alertes, signalements et qualité",
    items: [
      { 
        title: "Alertes", 
        href: "/modern-admin/alerts", 
        icon: AlertTriangle,
        badge: null
      },
      { 
        title: "Signalements", 
        href: "/modern-admin/reviews", 
        icon: Shield,
        badge: null
      },
      { 
        title: "Qualité", 
        href: "/modern-admin/quality", 
        icon: Shield,
        badge: null
      }
    ]
  },
  {
    label: "Configuration",
    description: "Paramètres et rapports",
    items: [
      { 
        title: "Zones", 
        href: "/modern-admin/zones", 
        icon: MapPin,
        badge: null
      },
      { 
        title: "Paramètres", 
        href: "/modern-admin/settings", 
        icon: Settings,
        badge: null
      },
      { 
        title: "Rapports", 
        href: "/modern-admin/reports", 
        icon: FileText,
        badge: null
      }
    ]
  },
  {
    label: "Tests & Systèmes",
    description: "Monitoring et tests techniques",
    items: [
      { 
        title: "Monitoring", 
        href: "/modern-admin/monitoring", 
        icon: TrendingUp,
        badge: null
      },
      { 
        title: "Tests Critiques", 
        href: "/modern-admin/tests-critiques", 
        icon: Shield,
        badge: null
      },
      { 
        title: "Tests Emails", 
        href: "/modern-admin/tests-emails", 
        icon: Mail,
        badge: null
      }
    ]
  }
];

function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: counts } = useAdminCounts();

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
              <>
                <SidebarGroupLabel className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
                  {group.label}
                </SidebarGroupLabel>
                {group.description && (
                  <p className="text-[10px] text-muted-foreground px-2 mb-2">
                    {group.description}
                  </p>
                )}
              </>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={itemIndex}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-primary text-primary-foreground font-medium"
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {item.title === "Missions" && counts?.missionsPending ? (
                                <Badge 
                                  variant="destructive"
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {counts.missionsPending}
                                </Badge>
                              ) : item.badge && (
                                <Badge 
                                  variant={item.badge.variant as any}
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {item.badge.text}
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
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold">Administration Bikawo</h1>
                  <p className="text-sm text-muted-foreground">Gérez votre plateforme en temps réel</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <NotificationBell />
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Admin</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}