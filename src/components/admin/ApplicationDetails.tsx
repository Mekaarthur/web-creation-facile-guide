import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Calendar, FileText, CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ApplicationDetailsProps {
  application: any;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

export const ApplicationDetails = ({ 
  application, 
  onApprove, 
  onReject,
  loading = false 
}: ApplicationDetailsProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'En attente', icon: Clock },
      approved: { variant: 'default', label: 'Approuvée', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rejetée', icon: XCircle },
      documents_pending: { variant: 'secondary', label: 'Documents en attente', icon: FileText },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const viewDocument = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {application.first_name} {application.last_name}
          </h2>
          <p className="text-muted-foreground">
            Candidature reçue le {format(new Date(application.created_at), 'PPP', { locale: fr })}
          </p>
        </div>
        {getStatusBadge(application.status)}
      </div>

      <Separator />

      {/* Informations de contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{application.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{application.phone}</span>
          </div>
          {application.city && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{application.city} {application.postal_code}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Services proposés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {application.service_categories?.map((service: string) => (
              <Badge key={service} variant="outline">
                {service}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disponibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Disponibilité & Expérience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Disponibilité:</span>{' '}
            <span className="text-muted-foreground">{application.availability}</span>
          </div>
          {application.experience_years !== undefined && (
            <div>
              <span className="font-medium">Expérience:</span>{' '}
              <span className="text-muted-foreground">{application.experience_years} ans</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivation */}
      {application.motivation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {application.motivation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents fournis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Pièce d\'identité', url: application.identity_document_url },
              { label: 'Casier judiciaire', url: application.criminal_record_url },
              { label: 'SIREN', value: application.siren_number },
              { label: 'RIB/IBAN', url: application.rib_iban_url },
              { label: 'CV', url: application.cv_file_url },
              { label: 'Certifications', url: application.certifications_url },
            ].map((doc) => (
              <div key={doc.label} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{doc.label}</span>
                </div>
                {doc.url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewDocument(doc.url)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                ) : doc.value ? (
                  <span className="text-sm text-muted-foreground">{doc.value}</span>
                ) : (
                  <Badge variant="secondary">Non fourni</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {application.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            onClick={onApprove}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver & Créer prestataire
          </Button>
          <Button
            onClick={onReject}
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        </div>
      )}

      {/* Commentaires admin */}
      {application.admin_comments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Commentaires admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {application.admin_comments}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
