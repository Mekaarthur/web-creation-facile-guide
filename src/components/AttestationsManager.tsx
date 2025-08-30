import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  Receipt,
  Building2,
  Baby,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Attestation {
  id: string;
  type: 'credit_impot' | 'caf';
  year: number;
  month?: number;
  amount: number;
  service_type: string;
  created_at: string;
  file_url?: string;
}

const AttestationsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadAttestations();
    }
  }, [user]);

  const loadAttestations = async () => {
    try {
      // Simuler des données d'attestations basées sur les factures
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user?.id)
        .order('issued_date', { ascending: false });

      // Générer des attestations fictives basées sur les factures
      const mockAttestations: Attestation[] = [
        {
          id: '1',
          type: 'credit_impot',
          year: 2024,
          amount: 1250.00,
          service_type: 'Services à la personne',
          created_at: '2024-01-31T00:00:00Z'
        },
        {
          id: '2',
          type: 'caf',
          year: 2024,
          month: 12,
          amount: 480.00,
          service_type: 'Garde d\'enfants',
          created_at: '2024-12-31T00:00:00Z'
        },
        {
          id: '3',
          type: 'credit_impot',
          year: 2023,
          amount: 890.00,
          service_type: 'Services à la personne',
          created_at: '2023-12-31T00:00:00Z'
        }
      ];

      setAttestations(mockAttestations);
    } catch (error) {
      console.error('Erreur lors du chargement des attestations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les attestations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAttestation = async (attestation: Attestation) => {
    try {
      // Simuler le téléchargement
      toast({
        title: "Téléchargement en cours",
        description: `Attestation ${attestation.type} ${attestation.year} en cours de téléchargement...`,
      });
      
      // Ici, vous appelleriez votre edge function pour générer le PDF
      // const { data } = await supabase.functions.invoke('generate-attestation', {
      //   body: { attestationId: attestation.id }
      // });
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'attestation",
        variant: "destructive",
      });
    }
  };

  const filteredAttestations = attestations.filter(attestation => {
    const matchesSearch = attestation.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !selectedYear || attestation.year.toString() === selectedYear;
    const matchesType = !selectedType || attestation.type === selectedType;
    
    return matchesSearch && matchesYear && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_impot': return <Building2 className="w-4 h-4" />;
      case 'caf': return <Baby className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'credit_impot': return 'Crédit d\'Impôt';
      case 'caf': return 'CAF';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'credit_impot': return 'bg-blue-100 text-blue-800';
      case 'caf': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Attestations Crédit d'Impôt et CAF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="year">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les années</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  <SelectItem value="credit_impot">Crédit d'Impôt</SelectItem>
                  <SelectItem value="caf">CAF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Crédit d'Impôt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Zone Crédit d'Impôt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAttestations
              .filter(att => att.type === 'credit_impot')
              .map((attestation) => (
                <div key={attestation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(attestation.type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Attestation {attestation.year}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {attestation.service_type} - {attestation.amount.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeBadgeColor(attestation.type)}>
                      {getTypeLabel(attestation.type)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAttestation(attestation)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            
            {filteredAttestations.filter(att => att.type === 'credit_impot').length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune attestation crédit d'impôt disponible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone CAF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-green-600" />
            Zone CAF (Caisses d'Allocations Familiales)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAttestations
              .filter(att => att.type === 'caf')
              .map((attestation) => (
                <div key={attestation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(attestation.type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Attestation {attestation.month ? `${attestation.month}/` : ''}{attestation.year}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {attestation.service_type} - {attestation.amount.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeBadgeColor(attestation.type)}>
                      {getTypeLabel(attestation.type)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAttestation(attestation)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            
            {filteredAttestations.filter(att => att.type === 'caf').length === 0 && (
              <div className="text-center py-8">
                <Baby className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune attestation CAF disponible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📋 Crédit d'Impôt</h4>
              <p className="text-sm text-blue-800">
                Les attestations annuelles sont nécessaires pour votre déclaration d'impôts. 
                Elles permettent de bénéficier d'un crédit d'impôt de 50% sur les services à la personne.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">👶 CAF</h4>
              <p className="text-sm text-green-800">
                Les attestations mensuelles peuvent être utilisées pour vos demandes d'aides auprès de la CAF, 
                notamment pour les frais de garde d'enfants et les services d'aide à domicile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttestationsManager;