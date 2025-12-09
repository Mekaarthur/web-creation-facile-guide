import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Battery, BatteryLow, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatus {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection;
      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
};

export const ConnectionIndicator = () => {
  const { isOnline, effectiveType } = useConnectionStatus();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when offline or on slow connection
    if (!isOnline || effectiveType === 'slow-2g' || effectiveType === '2g') {
      setShowIndicator(true);
    } else {
      // Hide after 3 seconds when back online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, effectiveType]);

  if (!showIndicator) return null;

  const getConnectionInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Hors ligne',
        color: 'bg-destructive text-destructive-foreground',
      };
    }
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        icon: Signal,
        text: 'Connexion lente',
        color: 'bg-yellow-500 text-white',
      };
    }
    return {
      icon: Wifi,
      text: 'Connecté',
      color: 'bg-green-500 text-white',
    };
  };

  const info = getConnectionInfo();
  const Icon = info.icon;

  return (
    <div className={cn(
      "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in",
      info.color
    )}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{info.text}</span>
    </div>
  );
};
