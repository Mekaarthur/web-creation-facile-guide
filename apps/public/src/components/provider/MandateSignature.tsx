import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileSignature, CheckCircle } from 'lucide-react';

interface MandateSignatureProps {
  providerId: string;
  providerName: string;
  onSigned?: () => void;
}

export const MandateSignature = ({ providerId, providerName, onSigned }: MandateSignatureProps) => {
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const mandateText = `
MANDAT DE FACTURATION BIKAWO

Je soussigné(e) ${providerName}, prestataire de services sur la plateforme Bikawo,
mandate par la présente la société Bikawo pour:

1. Émettre des factures en mon nom pour les prestations réalisées via la plateforme
2. Gérer l'encaissement des paiements clients
3. Me reverser les montants dus selon les conditions tarifaires convenues
4. Déclarer les montants perçus aux organismes fiscaux et sociaux compétents

CONDITIONS:
- Bikawo émettra une facture pour chaque prestation réalisée
- Les paiements clients seront encaissés par Bikawo
- Bikawo reversera 70% du montant HT au prestataire sous 10 jours ouvrés
- Bikawo conserve 30% pour ses frais de plateforme et services
- Le prestataire reste responsable de ses obligations fiscales et sociales

DURÉE:
Ce mandat prend effet à la date d'acceptation et reste valable tant que
le prestataire est actif sur la plateforme Bikawo.

RÉSILIATION:
Ce mandat peut être résilié par l'une ou l'autre des parties moyennant
un préavis de 30 jours par lettre recommandée avec accusé de réception.

Fait le ${new Date().toLocaleDateString('fr-FR')}
  `.trim();

  const handleAccept = async () => {
    if (!accepted) {
      toast.error('Veuillez accepter les termes du mandat');
      return;
    }

    try {
      setSigning(true);

      const { error } = await supabase
        .from('providers')
        .update({
          mandat_facturation_accepte: true,
          mandat_signature_date: new Date().toISOString(),
        })
        .eq('id', providerId);

      if (error) throw error;

      await supabase
        .from('communications')
        .insert({
          type: 'notification',
          destinataire_id: null,
          sujet: 'Mandat de facturation accepté',
          contenu: `${providerName} a accepté le mandat de facturation. Provider ID: ${providerId}`,
          related_entity_type: 'provider',
          related_entity_id: providerId,
          status: 'en_attente'
        });

      toast.success('Mandat accepté avec succès', {
        description: 'Vous pouvez maintenant continuer votre inscription'
      });

      setSigned(true);
      onSigned?.();
    } catch (error: any) {
      toast.error("Erreur lors de l'acceptation", { description: error.message });
    } finally {
      setSigning(false);
    }
  };

  if (signed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mandat accepté
          </CardTitle>
          <CardDescription>
            Votre mandat de facturation a été accepté avec succès
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-medium text-green-700">Mandat actif</p>
              <p className="text-sm text-green-600">
                Accepté le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Mandat de facturation
        </CardTitle>
        <CardDescription>
          Lisez et acceptez le mandat pour permettre à Bikawo de gérer votre facturation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
          <pre className="whitespace-pre-wrap text-sm font-mono">{mandateText}</pre>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="accept-mandate"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label
            htmlFor="accept-mandate"
            className="text-sm leading-relaxed cursor-pointer"
          >
            Je certifie avoir lu et compris les termes du mandat de facturation.
            J'autorise Bikawo à émettre des factures en mon nom et à gérer les
            encaissements selon les conditions définies ci-dessus.
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!accepted || signing}
          className="w-full"
          size="lg"
        >
          {signing ? 'Enregistrement...' : 'Accepter le mandat'}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          En acceptant ce mandat, vous autorisez Bikawo à gérer votre facturation
          selon les conditions ci-dessus
        </div>
      </CardContent>
    </Card>
  );
};
