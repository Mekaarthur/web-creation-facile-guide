import { useState, useEffect } from 'react';

interface MobileCapabilities {
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
  canUseCamera: boolean;
  canUseLocation: boolean;
  canReceivePush: boolean;
}

export const useMobileCapabilities = (): MobileCapabilities => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isNative: false,
    platform: 'web',
    canUseCamera: false,
    canUseLocation: false,
    canReceivePush: false
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      // Détection de Capacitor
      const isNative = !!(window as any).Capacitor;
      
      let platform: 'web' | 'ios' | 'android' = 'web';
      if (isNative) {
        const { Capacitor } = await import('@capacitor/core');
        platform = Capacitor.getPlatform() as 'ios' | 'android';
      }

      // Vérification des capacités
      const canUseCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      const canUseLocation = 'geolocation' in navigator;
      const canReceivePush = 'serviceWorker' in navigator && 'PushManager' in window;

      setCapabilities({
        isNative,
        platform,
        canUseCamera,
        canUseLocation,
        canReceivePush
      });
    };

    checkCapabilities();
  }, []);

  return capabilities;
};