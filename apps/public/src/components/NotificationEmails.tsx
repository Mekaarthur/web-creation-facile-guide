import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, Settings, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationEmailsProps {
  userId?: string;
}

const NotificationEmails = ({ userId }: NotificationEmailsProps) => {
  const [emailSettings, setEmailSettings] = useState({
    bookingConfirmation: true,
    reminderNotifications: true,
    promotionalEmails: false,
    weeklyReport: true,
    statusUpdates: true
  });
  const [emailTemplates, setEmailTemplates] = useState([
    {
      id: 1,
      name: "Confirmation de réservation",
      status: "active",
      lastSent: "Il y a 2 heures",
      type: "booking"
    },
    {
      id: 2,
      name: "Rappel de prestation",
      status: "active",
      lastSent: "Il y a 1 jour",
      type: "reminder"
    },
    {
      id: 3,
      name: "Validation prestataire",
      status: "pending",
      lastSent: "Jamais",
      type: "validation"
    }
  ]);
  const { toast } = useToast();

  const handleSettingChange = (setting: string, value: boolean) => {
    setEmailSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    toast({
      title: "Paramètres mis à jour",
      description: `Les notifications ${setting} ont été ${value ? 'activées' : 'désactivées'}.`,
    });
  };

  const sendTestEmail = (templateId: number) => {
    toast({
      title: "Email de test envoyé",
      description: "Vérifiez votre boîte de réception.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success">Actif</Badge>;
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="destructive">Inactif</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Paramètres de notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Paramètres de notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmations de réservation</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un email à chaque nouvelle réservation
                </p>
              </div>
              <Switch
                checked={emailSettings.bookingConfirmation}
                onCheckedChange={(value) => handleSettingChange("bookingConfirmation", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rappels de prestation</Label>
                <p className="text-sm text-muted-foreground">
                  Rappels automatiques 24h avant la prestation
                </p>
              </div>
              <Switch
                checked={emailSettings.reminderNotifications}
                onCheckedChange={(value) => handleSettingChange("reminderNotifications", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mises à jour de statut</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications sur les changements de statut
                </p>
              </div>
              <Switch
                checked={emailSettings.statusUpdates}
                onCheckedChange={(value) => handleSettingChange("statusUpdates", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rapport hebdomadaire</Label>
                <p className="text-sm text-muted-foreground">
                  Résumé hebdomadaire de votre activité
                </p>
              </div>
              <Switch
                checked={emailSettings.weeklyReport}
                onCheckedChange={(value) => handleSettingChange("weeklyReport", value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emails promotionnels</Label>
                <p className="text-sm text-muted-foreground">
                  Offres spéciales et nouveautés
                </p>
              </div>
              <Switch
                checked={emailSettings.promotionalEmails}
                onCheckedChange={(value) => handleSettingChange("promotionalEmails", value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates d'emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Templates d'emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(template.status)}
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Dernier envoi : {template.lastSent}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(template.status)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendTestEmail(template.id)}
                  >
                    Tester
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configuration SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Serveur SMTP</Label>
              <Input placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input placeholder="587" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email d'expédition</Label>
            <Input placeholder="noreply@assistme.fr" />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe d'application</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button variant="outline" className="w-full">
            Tester la configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationEmails;