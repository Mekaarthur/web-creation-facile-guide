import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Initialiser Google Consent Mode en mode "denied" par défaut
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }

    const consent = localStorage.getItem("cookie_consent");
    const consentDate = localStorage.getItem("cookie_consent_date");
    
    if (!consent) {
      setShowBanner(true);
    } else {
      // Vérifier si le consentement a expiré (6 mois)
      if (consentDate) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const storedDate = new Date(consentDate);
        
        if (storedDate < sixMonthsAgo) {
          // Le consentement a expiré, redemander
          localStorage.removeItem("cookie_consent");
          localStorage.removeItem("cookie_consent_date");
          setShowBanner(true);
        } else {
          // Appliquer le consentement existant
          const storedPrefs = JSON.parse(consent);
          if (storedPrefs.analytics) {
            (window as any).gtag?.('consent', 'update', {
              'analytics_storage': 'granted'
            });
          }
          if (storedPrefs.marketing) {
            (window as any).gtag?.('consent', 'update', {
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted'
            });
          }
        }
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie_consent", JSON.stringify(prefs));
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    
    // Mettre à jour Google Consent Mode
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'ad_user_data': prefs.marketing ? 'granted' : 'denied',
        'ad_personalization': prefs.marketing ? 'granted' : 'denied'
      });
    }
    
    // Notifier les autres composants du changement de consentement
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: prefs 
    }));
    
    setShowBanner(false);
    setShowCustomize(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-elegant animate-in slide-in-from-bottom">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <strong>Bikawo</strong> utilise des cookies pour améliorer votre expérience et mesurer l'audience. 
                Vous pouvez accepter ou refuser.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomize(true)}
                className="text-xs"
              >
                Personnaliser mes choix
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="text-xs"
              >
                Refuser tout
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="text-xs"
              >
                Accepter tout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personnaliser mes choix de cookies</DialogTitle>
            <DialogDescription>
              Choisissez les types de cookies que vous souhaitez autoriser
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={preferences.necessary}
                disabled
                className="mt-1"
              />
              <div className="flex-1">
                <label className="text-sm font-medium">
                  Cookies nécessaires
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked as boolean })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <label className="text-sm font-medium">
                  Cookies analytiques
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Nous permettent de mesurer l'audience et d'améliorer notre site.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked as boolean })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <label className="text-sm font-medium">
                  Cookies marketing
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisés pour vous proposer des publicités personnalisées.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCustomize(false)}>
              Annuler
            </Button>
            <Button onClick={saveCustom}>
              Enregistrer mes choix
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner;
