import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, FileCheck, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IdentityVerificationPanelProps {
  providerId: string;
  providerName: string;
  providerEmail?: string;
  onVerified?: () => void;
}

export const IdentityVerificationPanel = ({
  providerId,
  providerName,
  providerEmail,
  onVerified
}: IdentityVerificationPanelProps) => {
  const [verificationMethod, setVerificationMethod] = useState<string>('video_call');
  const [notes, setNotes] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_identity_verifications')
        .select('*')
        .eq('provider_id', providerId)
        .order('verification_date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    }
  };

  const handleVerification = async () => {
    if (verified === null) {
      toast.error('Veuillez sélectionner si l\'identité est vérifiée ou non');
      return;
    }

    if (!notes.trim()) {
      toast.error('Veuillez ajouter des notes sur la vérification');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Enregistrer la vérification
      const { error: verificationError } = await supabase
        .from('provider_identity_verifications')
        .insert({
          provider_id: providerId,
          admin_user_id: user.id,
          verification_method: verificationMethod,
          verified,
          notes
        });

      if (verificationError) throw verificationError;

      // Mettre à jour le statut du prestataire si vérifié
      if (verified) {
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            status: 'active',
            is_verified: true
          })
          .eq('id', providerId);

        if (updateError) throw updateError;

        // Envoyer email de confirmation
        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              type: 'provider_account_activated',
              recipientEmail: providerEmail,
              recipientName: providerName,
              data: {
                providerName,
                activationDate: new Date().toLocaleDateString('fr-FR')
              }
            }
          });
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

        toast.success('Prestataire activé', {
          description: 'Le prestataire peut maintenant recevoir des missions'
        });
        onVerified?.();
      } else {
        toast.success('Vérification enregistrée', {
          description: 'Le prestataire n\'a pas été activé'
        });
      }

      // Reset form
      setNotes('');
      setVerified(null);
      loadHistory();

    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vérification d'identité
          </CardTitle>
          <CardDescription>
            Vérifiez l'identité du prestataire avant activation du compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Méthode de vérification */}
          <div className="space-y-3">
            <Label>Méthode de vérification</Label>
            <RadioGroup
              value={verificationMethod}
              onValueChange={setVerificationMethod}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video_call" id="video_call" />
                <Label htmlFor="video_call" className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  Appel vidéo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="document_check" id="document_check" />
                <Label htmlFor="document_check" className="flex items-center gap-2 cursor-pointer">
                  <FileCheck className="h-4 w-4" />
                  Vérification documents uniquement
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Rencontre en personne
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Check-list */}
          <div className="space-y-2">
            <Label>Check-list de vérification</Label>
            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="check-1" />
                <label htmlFor="check-1">Photos correspondent à la pièce d'identité</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="check-2" />
                <label htmlFor="check-2">Documents valides et non expirés</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="check-3" />
                <label htmlFor="check-3">Vérification casier judiciaire (si applicable)</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="check-4" />
                <label htmlFor="check-4">Échange verbal satisfaisant</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="check-5" />
                <label htmlFor="check-5">Formation complétée avec succès</label>
              </div>
            </div>
          </div>

          {/* Résultat */}
          <div className="space-y-3">
            <Label>Résultat de la vérification</Label>
            <RadioGroup
              value={verified === null ? '' : verified ? 'verified' : 'rejected'}
              onValueChange={(value) => setVerified(value === 'verified')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="verified" id="verified" />
                <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Identité vérifiée - Activer le prestataire
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer text-red-600">
                  <XCircle className="h-4 w-4" />
                  Identité non vérifiée - Refuser l'activation
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label>Notes détaillées *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez la vérification effectuée, ce qui a été vérifié, les éventuels points d'attention..."
              rows={4}
            />
          </div>

          {/* Bouton validation */}
          <Button
            onClick={handleVerification}
            disabled={loading || verified === null || !notes.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer la vérification'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Historique */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des vérifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {record.verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">
                        {record.verification_method === 'video_call' && 'Appel vidéo'}
                        {record.verification_method === 'document_check' && 'Documents'}
                        {record.verification_method === 'in_person' && 'En personne'}
                      </span>
                    </div>
                    <Badge variant={record.verified ? 'default' : 'destructive'}>
                      {record.verified ? 'Vérifiée' : 'Refusée'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{record.notes}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.verification_date).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
