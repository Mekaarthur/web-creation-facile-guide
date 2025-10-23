import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  PieChart
} from "lucide-react";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Vue d'ensemble",
    items: [
      { 
        title: "Dashboard", 
        href: "/admin/dashboard", 
        icon: BarChart3,
        badge: null
      },
      { 
        title: "Alertes", 
        href: "/admin/alertes", 
        icon: AlertTriangle,
        badge: { text: "3", variant: "destructive" }
      }
    ]
  },
  {
    label: "Gestion Utilisateurs",
    items: [
      { 
        title: "Clients", 
        href: "/admin/utilisateurs", 
        icon: Users,
        badge: { text: "8.2k", variant: "secondary" }
      },
      { 
        title: "Prestataires", 
        href: "/admin/prestataires", 
        icon: UserCheck,
        badge: { text: "2.1k", variant: "secondary" }
      }
    ]
  },
  {
    label: "Opérations",
    items: [
      { 
        title: "Missions", 
        href: "/admin/kanban", 
        icon: Target,
        badge: { text: "147", variant: "default" }
      },
      { 
        title: "Assignations", 
        href: "/admin/assignations", 
        icon: Calendar,
        badge: null
      },
      { 
        title: "Modération", 
        href: "/admin/moderation", 
        icon: Shield,
        badge: { text: "5", variant: "destructive" }
      }
    ]
  },
  {
    label: "Finance & Analytics",
    items: [
      { 
        title: "Finances", 
        href: "/admin/finances", 
        icon: Euro,
        badge: null
      },
      { 
        title: "Paiements", 
        href: "/admin/paiements", 
        icon: CreditCard,
        badge: { text: "23k€", variant: "default" }
      },
      { 
        title: "Cooptation", 
        href: "/admin/cooptation", 
        icon: Users,
        badge: null
      },
      { 
        title: "Analytics", 
        href: "/admin/analytics", 
        icon: PieChart,
        badge: null
      },
      { 
        title: "Rapports", 
        href: "/admin/rapports", 
        icon: FileText,
        badge: null
      }
    ]
  },
  {
    label: "Configuration",
    items: [
      { 
        title: "Paramètres", 
        href: "/modern-admin/settings", 
        icon: Settings,
        badge: null
      },
      { 
        title: "Zones", 
        href: "/modern-admin/zones", 
        icon: MapPin,
        badge: null
      },
      { 
        title: "Marque", 
        href: "/modern-admin/marque", 
        icon: Palette,
        badge: null
      },
      { 
        title: "Messagerie", 
        href: "/admin/messagerie", 
        icon: MessageSquare,
        badge: { text: "12", variant: "default" }
      },
      { 
        title: "Outils", 
        href: "/admin/outils", 
        icon: Wrench,
        badge: null
      }
    ]
  },
  {
    label: "Tests & Systèmes",
    items: [
      { 
        title: "Monitoring", 
        href: "/admin/monitoring", 
        icon: TrendingUp,
        badge: null
      },
      { 
        title: "Tests Emails", 
        href: "/admin/tests-emails", 
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
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </SidebarGroupLabel>
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
                              {item.badge && (
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
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 text-xs bg-destructive">
                    3
                  </Badge>
                </Button>
                
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