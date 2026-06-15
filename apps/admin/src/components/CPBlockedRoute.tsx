import { ReactNode } from 'react';
import { EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  /** Si true, bloque également les agents Support Client (R-SC-05) */
  alsoBlockSC?: boolean;
}

export function CPBlockedRoute({ children, alsoBlockSC = false }: Props) {
  const { hasRole } = useAuth();
  const isCPOnly = hasRole('comptable_partenaire') && !hasRole('admin');
  const isSCOnly = alsoBlockSC && hasRole('support_client') && !hasRole('admin');

  if (isCPOnly || isSCOnly) {
    const rule = isCPOnly ? 'R-CP-04' : 'R-SC-05';
    const label = isCPOnly ? 'aux Comptables/Partenaires' : 'aux agents Support Client';
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md border-orange-300 dark:border-orange-800">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950 mx-auto mb-3">
              <EyeOff className="h-7 w-7 text-orange-600" />
            </div>
            <CardTitle className="text-orange-700 dark:text-orange-400">
              Données personnelles restreintes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground space-y-2">
            <p>Cette section contient des données personnelles non accessibles {label} ({rule}).</p>
            <p className="text-xs">Contactez un administrateur si vous pensez que c'est une erreur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
