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
  Mail,
  CheckSquare,
  Zap,
  UserCog,
  Building2
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAdminCounts } from "@/hooks/useAdminCounts"

export function AdminSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  
  // Récupérer les counts dynamiques
  const { data: counts } = useAdminCounts()

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
      title: "🔧 Vue Technique",
      description: "Gestion des comptes et authentification",
      items: [
        { 
          title: "Utilisateurs", 
          url: "/modern-admin/utilisateurs", 
          icon: UserCog,
          description: "Gestion AUTH globale • Activation/Suspension rapide"
        },
      ]
    },
    {
      title: "💼 Gestion Business",
      description: "Suivi clients, prestataires et relations commerciales",
      items: [
        { 
          title: "Clients", 
          url: "/modern-admin/clients", 
          icon: Users,
          description: "Profils détaillés • Stats CA • Rétention"
        },
        { 
          title: "Prestataires", 
          url: "/modern-admin/providers", 
          icon: UserCheck, 
          badge: counts?.prestatairesPending,
          description: "Gestion prestataires • Validation • Performance"
        },
        { 
          title: "Candidatures", 
          url: "/modern-admin/applications", 
          icon: FileText, 
          badge: counts?.candidatures,
          description: "Validation candidatures • Création auto prestataire"
        },
        { 
          title: "Binômes", 
          url: "/modern-admin/binomes", 
          icon: Star,
          description: "Gestion des binômes client-prestataire"
        },
        { 
          title: "Cooptation", 
          url: "/modern-admin/cooptation", 
          icon: Users,
          description: "Programme parrainage prestataires"
        },
      ]
    },
    {
      title: "🤖 Automatisation",
      description: "Outils intelligents et automatisation",
      items: [
        { 
          title: "Onboarding", 
          url: "/modern-admin/onboarding", 
          icon: CheckSquare,
          description: "Parcours d'intégration automatisé"
        },
        { 
          title: "Matching IA", 
          url: "/modern-admin/matching", 
          icon: Zap,
          description: "Attribution intelligente des missions"
        },
      ]
    },
    {
      title: "📋 Opérations",
      description: "Missions, réservations et facturation",
      items: [
        { 
          title: "Missions", 
          url: "/modern-admin/missions", 
          icon: Calendar,
          description: "Suivi des missions en cours"
        },
        { 
          title: "Réservations", 
          url: "/modern-admin/reservations", 
          icon: Clock,
          description: "Gestion des réservations"
        },
        { 
          title: "Paiements", 
          url: "/modern-admin/payments", 
          icon: Euro,
          description: "Transactions et paiements"
        },
        { 
          title: "Factures", 
          url: "/modern-admin/invoices", 
          icon: FileText,
          description: "Facturation et comptabilité"
        },
      ]
    },
    {
      title: "💬 Communication",
      description: "Messages, notifications et avis",
      items: [
        { 
          title: "Messages", 
          url: "/modern-admin/messages", 
          icon: MessageSquare, 
          badge: counts?.messages,
          description: "Messagerie plateforme"
        },
        { 
          title: "Notifications", 
          url: "/modern-admin/notifications", 
          icon: Mail,
          description: "Notifications système"
        },
        { 
          title: "Avis & Notes", 
          url: "/modern-admin/reviews", 
          icon: Star, 
          badge: counts?.moderation,
          description: "Modération des avis"
        },
      ]
    },
    {
      title: "🛡️ Modération",
      description: "Alertes, signalements et qualité",
      items: [
        { 
          title: "Alertes", 
          url: "/modern-admin/alerts", 
          icon: AlertTriangle, 
          badge: counts?.alerts,
          description: "Alertes système"
        },
        { 
          title: "Signalements", 
          url: "/modern-admin/reports", 
          icon: Shield,
          description: "Contenus signalés"
        },
        { 
          title: "Qualité", 
          url: "/modern-admin/quality", 
          icon: Star,
          description: "Contrôle qualité"
        },
      ]
    },
    {
      title: "⚙️ Configuration",
      description: "Paramètres, zones et marque",
      items: [
        { 
          title: "Zones", 
          url: "/modern-admin/zones", 
          icon: MapPin,
          description: "Gestion des zones géographiques"
        },
        { 
          title: "Marque", 
          url: "/modern-admin/marque", 
          icon: Building2,
          description: "Gestion de la marque"
        },
        { 
          title: "Paramètres", 
          url: "/modern-admin/settings", 
          icon: Settings,
          description: "Configuration système"
        },
        { 
          title: "Rapports", 
          url: "/modern-admin/reports-data", 
          icon: PieChart,
          description: "Rapports et analyses"
        },
      ]
    },
    {
      title: "🔬 Tests & Systèmes",
      description: "Monitoring et tests techniques",
      items: [
        { 
          title: "Monitoring", 
          url: "/modern-admin/monitoring", 
          icon: Activity,
          description: "Surveillance système"
        },
        { 
          title: "Tests Critiques", 
          url: "/modern-admin/tests-critiques", 
          icon: Shield,
          description: "Tests de sécurité"
        },
        { 
          title: "Tests Emails", 
          url: "/modern-admin/tests-emails", 
          icon: Mail,
          description: "Tests envoi emails"
        },
      ]
    }
  ]

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
              <div className="px-4 py-2">
                <SidebarGroupLabel className="text-xs font-semibold text-foreground">
                  {section.title}
                </SidebarGroupLabel>
                {section.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {section.description}
                  </p>
                )}
              </div>
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
                        title={item.description}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && (
                           <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
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