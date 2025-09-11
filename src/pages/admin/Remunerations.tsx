import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const fichesData: FicheRemuneration[] = [
  {
    id: '1',
    numero: 'REM-2024-0001',
    prestataire: 'Sophie Martin',
    montantBrut: 875.00,
    montantNet: 729.17,
    periode: '2024-01',
    statut: 'traite',
    missions: 15,
    heures: 35
  }
];

const Remunerations: React.FC = () => {
  const [fiches, setFiches] = useState<FicheRemuneration[]>(fichesData);
  const [recherche, setRecherche] = useState('');
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fiches de Rémunération</h1>
        <p className="text-muted-foreground mt-2">
          Gestion des rémunérations prestataires
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fiches</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Remunerations;