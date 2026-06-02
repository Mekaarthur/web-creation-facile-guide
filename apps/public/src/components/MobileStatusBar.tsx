import React, { useEffect, useState } from 'react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';

export const MobileStatusBar: React.FC = () => {
  const { isNative, platform } = useMobileCapabilities();
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  useEffect(() => {
    const setupStatusBar = async () => {
      if (!isNative) return;

      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        
        // Configurer la barre de statut
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
        
        // Obtenir la hauteur de la barre de statut pour iOS
        if (platform === 'ios') {
          setStatusBarHeight(44); // Hauteur standard iOS
        }
      } catch (error) {
        console.log('StatusBar plugin not available');
      }
    };

    setupStatusBar();
  }, [isNative]);

  if (!isNative || statusBarHeight === 0) {
    return null;
  }

  return (
    <div 
      className="bg-background border-b border-border"
      style={{ height: `${statusBarHeight}px` }}
    />
  );
};