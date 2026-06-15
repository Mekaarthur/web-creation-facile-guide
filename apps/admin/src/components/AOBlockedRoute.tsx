import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  /** Si true, bloque également les Comptables/Partenaires (sections admin-only) */
  alsoBlockCP?: boolean;
}

export function AOBlockedRoute({ children, alsoBlockCP = false }: Props) {
  const { hasRole } = useAuth();
  const isAOOnly = hasRole('agent_operationnel') && !hasRole('admin');
  const isCPOnly = alsoBlockCP && hasRole('comptable_partenaire') && !hasRole('admin');

  if (isAOOnly || isCPOnly) {
    const label = isAOOnly ? 'aux Agents Opérationnels' : 'aux Comptables/Partenaires';
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mx-auto mb-3">
              <Lock className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Section restreinte</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground space-y-2">
            <p>Cette section n'est pas accessible {label}.</p>
            <p className="text-xs">Contactez un administrateur si vous pensez que c'est une erreur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
