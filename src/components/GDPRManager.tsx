import { useState } from "react";
import { Download, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useConsents, useGDPRExport } from "@/hooks/useGDPR";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CONSENT_VERSION = "1.0.0";

const CONSENT_TYPES = [
  {
    type: 'cookies',
    label: 'Cookies',
    description: 'Autoriser les cookies pour améliorer votre expérience',
  },
  {
    type: 'marketing',
    label: 'Marketing',
    description: 'Recevoir des emails promotionnels et offres spéciales',
  },
  {
    type: 'analytics',
    label: 'Analytiques',
    description: 'Partager des données anonymes pour améliorer nos services',
  },
  {
    type: 'data_processing',
    label: 'Traitement des données',
    description: 'Autoriser le traitement de vos données personnelles',
    required: true,
  },
];

export const GDPRManager = () => {
  const { consents, recordConsent } = useConsents();
  const { exports, requestExport, getUserData } = useGDPRExport();
  const [downloading, setDownloading] = useState(false);

  const handleConsentChange = (consentType: string, granted: boolean) => {
    recordConsent.mutate({
      consentType,
      granted,
      version: CONSENT_VERSION,
    });
  };

  const handleDownloadData = async () => {
    try {
      setDownloading(true);
      const data = await getUserData();
      
      // Créer un fichier JSON téléchargeable
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bikawo-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "Vos données ont été téléchargées",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getConsentValue = (type: string) => {
    const consent = consents.find(c => c.consent_type === type);
    return consent?.granted || false;
  };

  return (
    <div className="space-y-6">
      {/* Gestion des consentements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestion de vos consentements
          </CardTitle>
          <CardDescription>
            Contrôlez comment nous utilisons vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_TYPES.map((consent) => (
            <div key={consent.type} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  {consent.label}
                  {consent.required && <Badge variant="secondary">Requis</Badge>}
                </Label>
                <p className="text-sm text-muted-foreground">{consent.description}</p>
              </div>
              <Switch
                checked={getConsentValue(consent.type)}
                onCheckedChange={(checked) => handleConsentChange(consent.type, checked)}
                disabled={consent.required || recordConsent.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Export de données RGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vos données personnelles (Article 15 RGPD)
          </CardTitle>
          <CardDescription>
            Téléchargez une copie de toutes vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadData}
              disabled={downloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Téléchargement..." : "Télécharger mes données"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => requestExport.mutate()}
              disabled={requestExport.isPending}
            >
              Demander un export complet
            </Button>
          </div>

          {exports.length > 0 && (
            <div className="space-y-2">
              <Label>Historique des exports</Label>
              {exports.slice(0, 5).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Export {exp.export_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(exp.requested_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <Badge variant={
                    exp.status === 'completed' ? 'default' :
                    exp.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {exp.status === 'completed' && 'Terminé'}
                    {exp.status === 'pending' && 'En attente'}
                    {exp.status === 'processing' && 'En cours'}
                    {exp.status === 'failed' && 'Échoué'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
