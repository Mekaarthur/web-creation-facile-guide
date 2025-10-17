import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const CookiePolicy = () => {
  const { t } = useTranslation();

  const openCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('openCookieSettings'));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-4">Politique de Cookies</h1>
        <p className="text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre ordinateur, tablette ou smartphone lors de votre visite sur notre site. 
              Il permet de mémoriser des informations relatives à votre navigation et d'améliorer votre expérience utilisateur.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Types de cookies utilisés</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2 text-primary">1. Cookies strictement nécessaires</h3>
                <p className="text-muted-foreground mb-2">
                  Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Cookies de session et d'authentification</li>
                  <li>Cookies de sécurité</li>
                  <li>Cookies de préférences de consentement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-primary">2. Cookies analytiques</h3>
                <p className="text-muted-foreground mb-2">
                  Ces cookies nous permettent de mesurer l'audience et d'améliorer les performances du site.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Google Analytics (mesure d'audience)</li>
                  <li>Hotjar (analyse du comportement utilisateur)</li>
                  <li>Microsoft Clarity (heatmaps et sessions)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Durée de conservation : 13 mois maximum
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-primary">3. Cookies marketing</h3>
                <p className="text-muted-foreground mb-2">
                  Ces cookies sont utilisés pour vous proposer des publicités pertinentes et mesurer l'efficacité de nos campagnes.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Facebook Pixel (publicités ciblées)</li>
                  <li>Google Ads (remarketing)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Durée de conservation : 13 mois maximum
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Gestion de vos préférences</h2>
            <p className="text-muted-foreground mb-4">
              Vous pouvez à tout moment modifier vos préférences de cookies en cliquant sur le bouton ci-dessous :
            </p>
            <Button onClick={openCookieSettings} variant="default">
              Gérer mes cookies
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Durée de conservation du consentement</h2>
            <p className="text-muted-foreground">
              Votre consentement est conservé pendant une durée de 6 mois. 
              Au-delà de cette période, nous vous demanderons à nouveau votre consentement.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation du traitement, 
              d'opposition et de portabilité de vos données. Pour exercer ces droits, consultez notre page{' '}
              <Link to="/espace-personnel" className="text-primary hover:underline">
                Gestion RGPD
              </Link>.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Comment supprimer les cookies ?</h2>
            <p className="text-muted-foreground mb-4">
              Vous pouvez configurer votre navigateur pour refuser les cookies ou supprimer ceux déjà enregistrés :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
              </li>
              <li>
                <strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies
              </li>
              <li>
                <strong>Safari :</strong> Préférences → Confidentialité → Cookies
              </li>
              <li>
                <strong>Edge :</strong> Paramètres → Cookies et autorisations de site
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Note : La désactivation de certains cookies peut affecter le fonctionnement du site.
            </p>
          </Card>

          <Card className="p-6 bg-muted">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant notre politique de cookies, contactez-nous à :{' '}
              <a href="mailto:contact@bikawo.com" className="text-primary hover:underline">
                contact@bikawo.com
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;