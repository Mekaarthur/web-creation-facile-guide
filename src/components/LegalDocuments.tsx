import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Shield, Eye, Edit, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LegalDocuments = () => {
  const [editing, setEditing] = useState<string | null>(null);
  const [documents, setDocuments] = useState({
    cgv: {
      title: "Conditions Générales de Vente",
      content: `CONDITIONS GÉNÉRALES DE VENTE

Article 1 - Objet
Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Bikawo et ses clients.

Article 2 - Services proposés
Bikawo propose des services d'assistance à domicile dans les domaines suivants :
- Garde d'enfants et soutien scolaire
- Assistance aux personnes âgées
- Services de ménage et logistique domestique
- Garde d'animaux
- Assistance voyage et conciergerie

Article 3 - Tarification
Les tarifs sont affichés en euros TTC. Ils peuvent être modifiés à tout moment mais les services en cours ne seront pas impactés.

Article 4 - Modalités de paiement
Le paiement s'effectue par carte bancaire, virement ou prélèvement automatique selon les formules choisies.

Article 5 - Annulation
Toute annulation doit être effectuée au moins 24h avant la prestation prévue.`,
      lastUpdate: "2024-01-15"
    },
    cgu: {
      title: "Conditions Générales d'Utilisation",
      content: `CONDITIONS GÉNÉRALES D'UTILISATION

Article 1 - Définitions
La plateforme Bikawo met en relation des particuliers avec des prestataires de services qualifiés.

Article 2 - Accès au service
L'accès aux services nécessite une inscription préalable et l'acceptation des présentes CGU.

Article 3 - Obligations de l'utilisateur
L'utilisateur s'engage à fournir des informations exactes et à respecter les prestataires.

Article 4 - Responsabilités
Bikawo agit en qualité d'intermédiaire et s'assure de la qualité des prestataires référencés.

Article 5 - Protection des données
Vos données personnelles sont protégées conformément au RGPD.`,
      lastUpdate: "2024-01-15"
    },
    privacy: {
      title: "Politique de Confidentialité",
      content: `POLITIQUE DE CONFIDENTIALITÉ

1. COLLECTE DES DONNÉES
Nous collectons les données nécessaires à la fourniture de nos services :
- Données d'identification (nom, prénom, email)
- Données de contact (adresse, téléphone)
- Données de paiement (coordonnées bancaires)

2. UTILISATION DES DONNÉES
Vos données sont utilisées pour :
- La gestion de votre compte
- La facturation des services
- L'amélioration de nos services
- La communication marketing (avec votre consentement)

3. PARTAGE DES DONNÉES
Nous ne vendons jamais vos données. Elles peuvent être partagées avec :
- Nos prestataires partenaires (pour la réalisation des services)
- Nos prestataires techniques (hébergement, paiement)
- Les autorités légales si requis

4. VOS DROITS
Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement
- Droit à la portabilité
- Droit d'opposition

5. SÉCURITÉ
Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données.

6. CONTACT
Pour toute question : contact@bikawo.com`,
      lastUpdate: "2024-01-15"
    },
    mentions: {
      title: "Mentions Légales",
      content: `MENTIONS LÉGALES

ÉDITEUR DU SITE
Bikawo SAS
Capital social : 50 000 €
SIRET : 12345678901234
RCS Paris B 123 456 789
TVA Intracommunautaire : FR12345678901

SIÈGE SOCIAL
123 Rue de la Tech
75001 Paris
France

CONTACT
Téléphone : 06 09 08 53 90
Email : contact@bikawo.com

DIRECTEUR DE PUBLICATION
Jean Dupont

HÉBERGEMENT
OVH SAS
2 rue Kellermann
59100 Roubaix
France

DONNÉES PERSONNELLES
Responsable du traitement : Bikawo SAS
DPO : dpo@assistme.fr

PROPRIÉTÉ INTELLECTUELLE
Tous les éléments du site sont protégés par le droit d'auteur, des marques ou des brevets.`,
      lastUpdate: "2024-01-15"
    }
  });

  const { toast } = useToast();

  const handleEdit = (docType: string) => {
    setEditing(docType);
  };

  const handleSave = (docType: string, content: string) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType as keyof typeof prev],
        content,
        lastUpdate: new Date().toISOString().split('T')[0]
      }
    }));
    setEditing(null);
    toast({
      title: "Document mis à jour",
      description: "Les modifications ont été sauvegardées avec succès.",
    });
  };

  const handleDownload = (docType: string) => {
    const doc = documents[docType as keyof typeof documents];
    const element = document.createElement("a");
    const file = new Blob([doc.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Téléchargement initié",
      description: "Le document a été téléchargé.",
    });
  };

  const DocumentCard = ({ docType, doc }: { docType: string; doc: any }) => {
    const [editContent, setEditContent] = useState(doc.content);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {doc.title}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(docType)}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              {editing === docType ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSave(docType, editContent)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(docType)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {doc.lastUpdate}
          </p>
        </CardHeader>
        <CardContent>
          {editing === docType ? (
            <div className="space-y-4">
              <Label>Contenu du document</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleSave(docType, editContent)}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                {doc.content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Documents légaux</h2>
      </div>

      <Tabs defaultValue="cgv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cgv">CGV</TabsTrigger>
          <TabsTrigger value="cgu">CGU</TabsTrigger>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
          <TabsTrigger value="mentions">Mentions légales</TabsTrigger>
        </TabsList>

        <TabsContent value="cgv">
          <DocumentCard docType="cgv" doc={documents.cgv} />
        </TabsContent>

        <TabsContent value="cgu">
          <DocumentCard docType="cgu" doc={documents.cgu} />
        </TabsContent>

        <TabsContent value="privacy">
          <DocumentCard docType="privacy" doc={documents.privacy} />
        </TabsContent>

        <TabsContent value="mentions">
          <DocumentCard docType="mentions" doc={documents.mentions} />
        </TabsContent>
      </Tabs>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-primary mb-2">Conformité RGPD</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ces documents sont conformes au Règlement Général sur la Protection des Données (RGPD) 
                et aux réglementations françaises en vigueur.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Protection des données personnelles assurée</p>
                <p>• Droits des utilisateurs respectés</p>
                <p>• Transparence sur l'utilisation des données</p>
                <p>• Possibilité de contact du DPO</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDocuments;