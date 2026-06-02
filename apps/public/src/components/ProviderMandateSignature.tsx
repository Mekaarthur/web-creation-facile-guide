import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProviderMandateSignatureProps {
  provider: any;
  onComplete: () => void;
}

export const ProviderMandateSignature = ({ provider, onComplete }: ProviderMandateSignatureProps) => {
  const { toast } = useToast();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    if (!acceptTerms) {
      toast({
        title: "Erreur",
        description: "Vous devez accepter les conditions du mandat",
        variant: "destructive"
      });
      return;
    }

    if (!signature || signature.trim().length < 3) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre signature (nom complet)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await onComplete();
      
      toast({
        title: "Mandat signé",
        description: "Votre mandat de facturation a été signé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de signer le mandat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mandat de facturation électronique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contenu du mandat */}
          <div className="bg-muted p-6 rounded-lg space-y-4 max-h-96 overflow-y-auto">
            <h3 className="font-bold text-lg">Mandat de facturation Bikawo</h3>
            
            <div className="space-y-3 text-sm">
              <p><strong>Entre :</strong></p>
              <p>
                Le prestataire : <strong>{provider?.business_name || 'Non renseigné'}</strong><br />
                SIRET : <strong>{provider?.siret_number || 'Non renseigné'}</strong>
              </p>

              <p><strong>Et :</strong></p>
              <p>
                Bikawo SAS - Plateforme de services à la personne<br />
                SIRET : 123 456 789 00012
              </p>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Article 1 - Objet du mandat</h4>
                <p>
                  Le prestataire mandate Bikawo pour établir et émettre les factures en son nom et pour son compte 
                  auprès des clients finaux pour les prestations réalisées via la plateforme Bikawo.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Article 2 - Obligations de Bikawo</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Émettre les factures conformément à la réglementation en vigueur</li>
                  <li>Utiliser les informations fiscales et commerciales du prestataire</li>
                  <li>Transmettre au prestataire une copie de chaque facture émise sous 48h</li>
                  <li>Établir une fiche de rémunération mensuelle détaillée</li>
                  <li>Reverser les montants dus au prestataire selon les conditions convenues (70% du montant client)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Article 3 - Obligations du prestataire</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fournir des informations fiscales exactes et à jour</li>
                  <li>Informer Bikawo de tout changement de situation (SIRET, TVA, etc.)</li>
                  <li>Conserver les copies des factures pendant 10 ans</li>
                  <li>Respecter les obligations déclaratives auprès des services fiscaux</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Article 4 - Durée et résiliation</h4>
                <p>
                  Ce mandat est conclu pour une durée indéterminée. Il peut être résilié par chacune des parties 
                  moyennant un préavis de 30 jours par lettre recommandée avec accusé de réception.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Article 5 - Protection des données</h4>
                <p>
                  Bikawo s'engage à traiter les données personnelles et fiscales du prestataire conformément au RGPD 
                  et à les utiliser uniquement dans le cadre de ce mandat.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="font-semibold text-yellow-900">Important :</p>
                <p className="text-yellow-800 text-xs mt-1">
                  Ce mandat permet à Bikawo de facturer en votre nom. Vous restez responsable de vos obligations 
                  fiscales et sociales en tant qu'auto-entrepreneur ou micro-entrepreneur.
                </p>
              </div>
            </div>
          </div>

          {/* Acceptation et signature */}
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                En signant ce mandat, vous autorisez Bikawo à émettre des factures en votre nom conformément 
                à l'article 289 bis du Code général des impôts.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="accept-terms" className="text-sm cursor-pointer">
                  J'ai lu et j'accepte les conditions du mandat de facturation. Je confirme que les informations 
                  fournies sont exactes et que je suis bien auto-entrepreneur ou micro-entrepreneur en règle.
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">
                  Signature électronique (saisissez votre nom complet) *
                </Label>
                <Input
                  id="signature"
                  placeholder="Prénom NOM"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="font-signature text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Votre signature électronique a la même valeur juridique qu'une signature manuscrite
                </p>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                Date de signature : {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            <Button
              onClick={handleSign}
              disabled={loading || !acceptTerms || !signature}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Signer le mandat électroniquement
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
