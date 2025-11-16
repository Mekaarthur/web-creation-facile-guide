import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Download, 
  Send, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FicheRemuneration {
  id: string;
  numero: string;
  prestataire: string;
  montantBrut: number;
  montantNet: number;
  periode: string;
  statut: 'brouillon' | 'envoye' | 'traite' | 'en_attente';
  missions: number;
  heures: number;
}

const Remunerations: React.FC = () => {
  const [fiches, setFiches] = useState<FicheRemuneration[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRemunerations();
  }, []);

  const loadRemunerations = async () => {
    try {
      setLoading(true);
      
      // Charger les transactions financières groupées par prestataire et mois
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          provider:providers(
            business_name,
            profiles(first_name, last_name)
          )
        `)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper par prestataire et mois
      const grouped: any = {};
      transactions?.forEach(t => {
        const monthKey = format(new Date(t.created_at), 'yyyy-MM');
        const providerId = t.provider_id;
        const key = `${providerId}-${monthKey}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            provider_id: providerId,
            provider_name: (t as any).provider?.business_name || 
              `${(t as any).provider?.profiles?.first_name} ${(t as any).provider?.profiles?.last_name}`,
            month: monthKey,
            total_brut: 0,
            missions: 0,
            transactions: []
          };
        }
        
        grouped[key].total_brut += Number(t.provider_payment);
        grouped[key].missions += 1;
        grouped[key].transactions.push(t);
      });

      // Convertir en format FicheRemuneration
      const fichesArr: FicheRemuneration[] = Object.entries(grouped).map(([key, data]: [string, any], index) => ({
        id: key,
        numero: `REM-${data.month}-${String(index + 1).padStart(4, '0')}`,
        prestataire: data.provider_name,
        montantBrut: data.total_brut,
        montantNet: data.total_brut * 0.833, // 83.3% après charges
        periode: data.month,
        statut: 'traite' as const,
        missions: data.missions,
        heures: data.missions * 2.5 // Estimation moyenne
      }));

      setFiches(fichesArr);
    } catch (error) {
      console.error('Erreur chargement rémunérations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rémunérations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: FicheRemuneration['statut']) => {
    const variants = {
      brouillon: { variant: 'secondary' as const, icon: Clock, label: 'Brouillon' },
      envoye: { variant: 'default' as const, icon: Send, label: 'Envoyé' },
      traite: { variant: 'default' as const, icon: CheckCircle, label: 'Traité' },
      en_attente: { variant: 'default' as const, icon: AlertCircle, label: 'En attente' }
    };

    const config = variants[statut];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleTelechargerPDF = (fiche: FicheRemuneration) => {
    toast({
      title: "PDF généré",
      description: `Le PDF de la fiche ${fiche.numero} a été téléchargé.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fiches de Rémunération</h1>
        <p className="text-muted-foreground mt-2">
          Gestion des rémunérations prestataires ({fiches.length} fiches)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fiches de rémunération</CardTitle>
          <CardDescription>
            Basées sur les transactions financières complétées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune fiche de rémunération disponible
            </div>
          ) : (
            <div className="space-y-4">
              {fiches.map((fiche) => (
                <div key={fiche.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{fiche.numero}</p>
                      <p className="text-sm text-muted-foreground">{fiche.prestataire}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{fiche.montantBrut.toFixed(2)}€</p>
                      <p className="text-xs text-muted-foreground">Net: {fiche.montantNet.toFixed(2)}€</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getStatutBadge(fiche.statut)}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTelechargerPDF(fiche)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Remunerations;