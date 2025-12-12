import { useState, useEffect } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
}

export const usePWA = () => {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
  });

  useEffect(() => {
    // Check if installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    setStatus(prev => ({
      ...prev,
      isInstalled: isStandalone || isIOSStandalone,
    }));

    // Listen for install prompt
    const handleInstallPrompt = () => {
      setStatus(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for online/offline
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Listen for service worker updates
    const handleSWUpdate = () => {
      setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for SW updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', handleSWUpdate);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.waiting) {
          // Envoyer le message au SW en attente
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Attendre que le nouveau SW prenne le contrôle
          await new Promise<void>((resolve) => {
            const onControllerChange = () => {
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
            
            // Timeout de sécurité
            setTimeout(resolve, 2000);
          });
        } else {
          // Forcer une vérification de mise à jour
          await registration.update();
        }
      } catch (error) {
        console.error('Erreur mise à jour SW:', error);
      }
    }
    // Recharger la page
    window.location.reload();
  };

  return { ...status, updateApp };
};
