import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  BarChart3,
  Users,
  UserCheck,
  Calendar,
  Euro,
  MessageSquare,
  Settings,
  AlertTriangle,
  TrendingUp,
  FileText,
  Shield,
  MapPin,
  Star,
  Clock,
  Activity,
  PieChart,
  Mail
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Vue d'ensemble",
    items: [
      { title: "Dashboard", url: "/modern-admin", icon: BarChart3 },
      { title: "Analytics", url: "/modern-admin/analytics", icon: TrendingUp },
      { title: "Temps Réel", url: "/modern-admin/realtime", icon: Activity },
    ]
  },
  {
    title: "Gestion Utilisateurs",
    items: [
      { title: "Clients", url: "/modern-admin/clients", icon: Users, badge: "248" },
      { title: "Prestataires", url: "/modern-admin/providers", icon: UserCheck, badge: "127" },
      { title: "Candidatures", url: "/modern-admin/applications", icon: FileText, badge: "12" },
      { title: "Binômes", url: "/modern-admin/binomes", icon: Star },
    ]
  },
  {
    title: "Operations",
    items: [
      { title: "Missions", url: "/modern-admin/missions", icon: Calendar, badge: "34" },
      { title: "Réservations", url: "/modern-admin/reservations", icon: Clock },
      { title: "Paiements", url: "/modern-admin/payments", icon: Euro },
      { title: "Factures", url: "/modern-admin/invoices", icon: FileText },
    ]
  },
  {
    title: "Communication",
    items: [
      { title: "Messages", url: "/modern-admin/messages", icon: MessageSquare, badge: "23" },
      { title: "Notifications", url: "/modern-admin/notifications", icon: Mail },
      { title: "Avis & Notes", url: "/modern-admin/reviews", icon: Star },
    ]
  },
  {
    title: "Modération",
    items: [
      { title: "Alertes", url: "/modern-admin/alerts", icon: AlertTriangle, badge: "5" },
      { title: "Signalements", url: "/modern-admin/reports", icon: Shield, badge: "2" },
      { title: "Qualité", url: "/modern-admin/quality", icon: Star },
    ]
  },
  {
    title: "Configuration",
    items: [
      { title: "Zones", url: "/modern-admin/zones", icon: MapPin },
      { title: "Paramètres", url: "/modern-admin/settings", icon: Settings },
      { title: "Rapports", url: "/modern-admin/reports-data", icon: PieChart },
    ]
  },
  {
    title: "Tests & Systèmes",
    items: [
      { title: "Tests Emails", url: "/admin/tests-emails", icon: Mail },
    ]
  }
]

export function AdminSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-accent/50"

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sm">Admin Bikawo</h2>
                <p className="text-xs text-muted-foreground">Panel de contrôle</p>
              </div>
            )}
          </div>
        </div>

        {menuItems.map((section) => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-4 py-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${getNavCls({ isActive })}`
                        }
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}