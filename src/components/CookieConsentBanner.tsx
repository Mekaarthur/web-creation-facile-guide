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
import { useConsents } from "@/hooks/useGDPR";
import { useAuth } from "@/hooks/useAuth";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const { user } = useAuth();
  const { recordConsent } = useConsents();
  
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

    // Écouter l'événement pour ouvrir les paramètres de cookies
    const handleOpenSettings = () => {
      setShowCustomize(true);
    };
    window.addEventListener('openCookieSettings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('openCookieSettings', handleOpenSettings);
    };
  }, []);

  const saveConsent = async (prefs: CookiePreferences) => {
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

    // Enregistrer les consentements en base de données si l'utilisateur est connecté
    if (user) {
      try {
        await recordConsent.mutateAsync({
          consentType: 'cookies',
          granted: prefs.necessary,
          version: '1.0',
        });
        
        if (prefs.analytics) {
          await recordConsent.mutateAsync({
            consentType: 'analytics',
            granted: true,
            version: '1.0',
          });
        }
        
        if (prefs.marketing) {
          await recordConsent.mutateAsync({
            consentType: 'marketing',
            granted: true,
            version: '1.0',
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du consentement:', error);
      }
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
      {/* Cookie banner compact - moins intrusif - z-40 pour ne pas superposer le tutoriel */}
      <div className="fixed bottom-4 left-4 right-4 md:left-4 md:max-w-sm z-40 p-4 bg-card border border-border rounded-xl shadow-elegant animate-in slide-in-from-bottom">
        <p className="text-xs text-muted-foreground mb-3">
          🍪 Nous utilisons des cookies pour améliorer votre expérience.
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomize(true)}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Personnaliser
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={rejectAll}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={acceptAll}
            className="text-xs ml-auto"
          >
            Accepter
          </Button>
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
