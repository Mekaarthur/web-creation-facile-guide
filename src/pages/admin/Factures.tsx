import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
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
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  numero: string;
  client: string;
  clientEmail: string;
  montant: number;
  dateEmission: string;
  dateEcheance: string;
  statut: 'brouillon' | 'envoye' | 'paye' | 'en_retard' | 'annule';
  service: string;
  paiementDate?: string;
}

const facturesData: Invoice[] = [
  {
    id: '1',
    numero: '2024-0001',
    client: 'Marie Dubois',
    clientEmail: 'marie.dubois@email.com',
    montant: 250.00,
    dateEmission: '2024-01-15',
    dateEcheance: '2024-02-15',
    statut: 'paye',
    service: 'Garde d\'enfants - 10h',
    paiementDate: '2024-02-10'
  },
  {
    id: '2',
    numero: '2024-0002',
    client: 'Pierre Lefebvre',
    clientEmail: 'pierre.lefebvre@email.com',
    montant: 180.00,
    dateEmission: '2024-01-16',
    dateEcheance: '2024-02-16',
    statut: 'envoye',
    service: 'Ménage à domicile - 6h'
  }
];

const Factures: React.FC = () => {
  const [factures, setFactures] = useState<Invoice[]>(facturesData);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const { toast } = useToast();

  const getStatutBadge = (statut: Invoice['statut']) => {
    const variants = {
      brouillon: { variant: 'secondary' as const, icon: Clock, label: 'Brouillon' },
      envoye: { variant: 'default' as const, icon: Send, label: 'Envoyé' },
      paye: { variant: 'default' as const, icon: CheckCircle, label: 'Payé' },
      en_retard: { variant: 'destructive' as const, icon: AlertCircle, label: 'En retard' },
      annule: { variant: 'secondary' as const, icon: XCircle, label: 'Annulé' }
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

  const facturesFiltrees = factures.filter(facture => {
    const matchRecherche = facture.client.toLowerCase().includes(recherche.toLowerCase()) ||
                          facture.numero.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || facture.statut === filtreStatut;
    
    return matchRecherche && matchStatut;
  });

  const handleEnvoyerFacture = (factureId: string) => {
    setFactures(prev => prev.map(f => 
      f.id === factureId 
        ? { ...f, statut: 'envoye' as const }
        : f
    ));
    toast({
      title: "Facture envoyée",
      description: "La facture a été envoyée au client par email.",
    });
  };

  const handleMarquerPayee = (factureId: string) => {
    setFactures(prev => prev.map(f => 
      f.id === factureId 
        ? { ...f, statut: 'paye' as const, paiementDate: new Date().toISOString().split('T')[0] }
        : f
    ));
    toast({
      title: "Paiement confirmé",
      description: "La facture a été marquée comme payée.",
    });
  };

  const handleTelechargerPDF = (facture: Invoice) => {
    toast({
      title: "PDF généré",
      description: `Le PDF de la facture ${facture.numero} a été téléchargé.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Factures Clients</h1>
        <p className="text-muted-foreground mt-2">
          Gestion et suivi des facturations clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par client ou numéro..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>Liste des factures clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {facturesFiltrees.map((facture) => (
              <div key={facture.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{facture.numero}</p>
                    <p className="text-sm text-muted-foreground">{facture.client}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{facture.montant.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">{facture.service}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {getStatutBadge(facture.statut)}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTelechargerPDF(facture)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {facture.statut === 'brouillon' && (
                      <Button size="sm" onClick={() => handleEnvoyerFacture(facture.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </Button>
                    )}
                    {facture.statut === 'envoye' && (
                      <Button size="sm" onClick={() => handleMarquerPayee(facture.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer payé
                      </Button>
                    )}
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

export default Factures;