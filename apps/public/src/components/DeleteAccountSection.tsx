import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, X, ShieldCheck } from 'lucide-react';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DeleteAccountSection = () => {
  const { loading, pendingRequest, checkExistingRequest, requestDeletion, cancelDeletion } = useDeleteAccount();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    checkExistingRequest();
  }, []);

  const handleRequest = async () => {
    const result = await requestDeletion(reason);
    if (result.success) {
      setShowConfirm(false);
      toast({
        title: 'Demande enregistrée',
        description: 'Votre compte sera supprimé dans 30 jours. Vous pouvez annuler à tout moment.',
      });
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    const result = await cancelDeletion();
    if (result.success) {
      toast({ title: 'Demande annulée', description: 'Votre compte sera conservé.' });
    } else {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler la demande.', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Suppression du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {pendingRequest ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-orange-800">Suppression programmée</p>
                <p className="text-sm text-orange-700">
                  Votre compte sera définitivement supprimé le{' '}
                  <strong>{format(pendingRequest.scheduledAt, 'dd MMMM yyyy', { locale: fr })}</strong>.
                </p>
                <p className="text-sm text-orange-600">
                  Vous pouvez annuler cette demande avant cette date.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler la suppression
            </Button>
          </div>
        ) : showConfirm ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-destructive">Cette action est irréversible</p>
                <p className="text-muted-foreground">
                  Vos données personnelles seront anonymisées et votre compte sera supprimé 30 jours après la demande.
                  Vos réservations passées seront conservées de façon anonyme pour des raisons comptables et légales.
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Raison de la suppression (facultatif)
              </label>
              <Textarea
                placeholder="Ex : Je n'utilise plus le service, je souhaite supprimer mes données..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleRequest}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Envoi...' : 'Confirmer la suppression'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Conformément au <strong>RGPD Article 17</strong>, vous avez le droit de demander la suppression
                de vos données personnelles. Un délai de 30 jours vous permet de changer d'avis.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(true)}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Demander la suppression de mon compte
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
