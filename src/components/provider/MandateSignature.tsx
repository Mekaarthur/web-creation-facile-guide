import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileSignature, CheckCircle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SignatureCanvas from 'react-signature-canvas';

interface MandateSignatureProps {
  providerId: string;
  providerName: string;
  onSigned?: () => void;
}

export const MandateSignature = ({ providerId, providerName, onSigned }: MandateSignatureProps) => {
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const signatureRef = useRef<any>(null);

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
Ce mandat prend effet à la date de signature et reste valable tant que 
le prestataire est actif sur la plateforme Bikawo.

RÉSILIATION:
Ce mandat peut être résilié par l'une ou l'autre des parties moyennant 
un préavis de 30 jours par lettre recommandée avec accusé de réception.

Fait le ${new Date().toLocaleDateString('fr-FR')}
  `.trim();

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Veuillez signer le mandat');
      return;
    }

    if (!accepted) {
      toast.error('Veuillez accepter les termes du mandat');
      return;
    }

    try {
      setSigning(true);

      // Convertir la signature en base64
      const signatureData = signatureRef.current.toDataURL();

      // Enregistrer dans la base de données
      const { error } = await supabase
        .from('providers')
        .update({
          mandat_facturation_accepte: true,
          mandat_signature_date: new Date().toISOString(),
          mandat_signature_data: signatureData
        })
        .eq('id', providerId);

      if (error) throw error;

      // Appeler l'edge function pour générer le PDF
      const { error: pdfError } = await supabase.functions.invoke('generate-mandate-pdf', {
        body: {
          providerId,
          providerName,
          signatureData,
          mandateText
        }
      });

      if (pdfError) console.error('PDF generation error:', pdfError);

      toast.success('Mandat signé avec succès', {
        description: 'Vous pouvez maintenant continuer votre inscription'
      });

      setSigned(true);
      onSigned?.();
    } catch (error: any) {
      toast.error('Erreur lors de la signature', { description: error.message });
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  if (signed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mandat signé
          </CardTitle>
          <CardDescription>
            Votre mandat de facturation a été signé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-medium text-green-700">Mandat actif</p>
              <p className="text-sm text-green-600">
                Signé le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Télécharger PDF
            </Button>
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
          Signature du mandat de facturation
        </CardTitle>
        <CardDescription>
          Lisez et signez le mandat pour permettre à Bikawo de gérer votre facturation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contenu du mandat */}
        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
          <pre className="whitespace-pre-wrap text-sm font-mono">{mandateText}</pre>
        </div>

        {/* Zone de signature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Votre signature</label>
            <Button variant="ghost" size="sm" onClick={clearSignature}>
              Effacer
            </Button>
          </div>
          <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-40',
                style: { touchAction: 'none' }
              }}
              backgroundColor="white"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Signez ci-dessus en utilisant votre souris ou votre doigt sur écran tactile
          </p>
        </div>

        {/* Acceptation */}
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

        {/* Bouton signature */}
        <Button
          onClick={handleSign}
          disabled={!accepted || signing}
          className="w-full"
          size="lg"
        >
          {signing ? 'Signature en cours...' : 'Signer le mandat'}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          En signant ce mandat, vous acceptez que Bikawo gère votre facturation 
          selon les conditions ci-dessus
        </div>
      </CardContent>
    </Card>
  );
};
