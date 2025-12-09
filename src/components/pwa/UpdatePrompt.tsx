import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const UpdatePrompt = () => {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-fade-in">
      <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg flex items-center gap-3">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Mise à jour disponible</p>
          <p className="text-xs opacity-90">Une nouvelle version est prête</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={updateApp}
        >
          Mettre à jour
        </Button>
      </div>
    </div>
  );
};
