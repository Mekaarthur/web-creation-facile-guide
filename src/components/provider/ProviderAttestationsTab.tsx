import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProviderAttestation {
  id: string;
  type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  issued_date: string;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

const ProviderAttestationsTab = () => {
  const { user } = useAuth();
  const [attestations, setAttestations] = useState<ProviderAttestation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAttestations();
  }, [user]);

  const loadAttestations = async () => {
    if (!user) return;

    // Get provider ID for current user
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('provider_attestations')
      .select('*')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setAttestations(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge variant="default">Actif</Badge>;
    if (status === 'expired') return <Badge variant="destructive">Expiré</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      nova_agreement: 'Agrément Nova',
      sap_certification: 'Certification SAP',
      insurance: 'Attestation Assurance',
      training: 'Attestation Formation',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Mes Attestations & Documents
        </CardTitle>
        <CardDescription>
          Vos attestations Nova, certifications et documents officiels
        </CardDescription>
      </CardHeader>
      <CardContent>
        {attestations.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune attestation disponible pour le moment.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos attestations Nova et documents seront ajoutés par l'administration.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attestations.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{att.title}</h4>
                      {getStatusBadge(att.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{getTypeLabel(att.type)}</p>
                    {att.description && (
                      <p className="text-sm text-muted-foreground mt-1">{att.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Émis le {format(new Date(att.issued_date), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                      {att.expiry_date && (
                        <span>Expire le {format(new Date(att.expiry_date), 'dd/MM/yyyy', { locale: fr })}</span>
                      )}
                    </div>
                  </div>
                </div>
                {att.file_url && (
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderAttestationsTab;
