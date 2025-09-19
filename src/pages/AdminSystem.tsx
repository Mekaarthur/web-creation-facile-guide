import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CreditCard, Mail, Shield, FileText, Users } from "lucide-react";
import PaymentSystem from "@/components/PaymentSystem";
import NotificationEmails from "@/components/NotificationEmails";
import ProviderValidation from "@/components/ProviderValidation";
import LegalDocuments from "@/components/LegalDocuments";
import EnhancedModernDashboard from "@/components/admin/enhanced/EnhancedModernDashboard";

const AdminSystem = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const systemFeatures = [
    {
      id: "dashboard",
      name: "Tableau de bord",
      icon: Settings,
      description: "Vue d'ensemble du système",
      status: "active",
      component: EnhancedModernDashboard
    },
    {
      id: "payment",
      name: "Système de paiement",
      icon: CreditCard,
      description: "Intégration Stripe/PayPal",
      status: "ready",
      component: PaymentSystem
    },
    {
      id: "emails",
      name: "Emails automatiques",
      icon: Mail,
      description: "Notifications et confirmations",
      status: "ready",
      component: NotificationEmails
    },
    {
      id: "validation",
      name: "Validation prestataires",
      icon: Shield,
      description: "Vérification des documents",
      status: "active",
      component: ProviderValidation
    },
    {
      id: "legal",
      name: "Documents légaux",
      icon: FileText,
      description: "CGV, CGU, RGPD",
      status: "ready",
      component: LegalDocuments
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success">Actif</Badge>;
      case "ready":
        return <Badge variant="default">Prêt</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    switch (status) {
      case "active":
        return <div className={`${iconClass} bg-success rounded-full`}></div>;
      case "ready":
        return <div className={`${iconClass} bg-primary rounded-full`}></div>;
      default:
        return <div className={`${iconClass} bg-muted rounded-full`}></div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Administration système</h1>
            <p className="text-muted-foreground">
              Gestion complète des fonctionnalités de la plateforme Assist'mw
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="payment">Paiements</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="legal">Légal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemFeatures.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <Card 
                      key={feature.id} 
                      className="hover:shadow-glow transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => setActiveFeature(feature.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-lg">{feature.name}</span>
                          </div>
                          {getStatusBadge(feature.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(feature.status)}
                          <span className="text-xs text-muted-foreground">
                            {feature.status === "active" ? "Fonctionnel" : 
                             feature.status === "ready" ? "Prêt à activer" : "Configuration requise"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Statut global */}
              <Card className="bg-gradient-subtle">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Statut de la plateforme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">85%</div>
                      <p className="text-sm text-muted-foreground">Fonctionnalités actives</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">3</div>
                      <p className="text-sm text-muted-foreground">Modules à configurer</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">Prêt</div>
                      <p className="text-sm text-muted-foreground">Pour la production</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard">
              <EnhancedModernDashboard />
            </TabsContent>

            <TabsContent value="payment">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Système de paiement</h2>
                  <p className="text-muted-foreground">
                    Configuration et test du système de paiement sécurisé
                  </p>
                </div>
                <div className="max-w-md">
                  <PaymentSystem 
                    amount={49.99}
                    onPaymentSuccess={() => console.log("Paiement réussi")}
                    onPaymentCancel={() => console.log("Paiement annulé")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emails">
              <NotificationEmails />
            </TabsContent>

            <TabsContent value="validation">
              <ProviderValidation />
            </TabsContent>

            <TabsContent value="legal">
              <LegalDocuments />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;