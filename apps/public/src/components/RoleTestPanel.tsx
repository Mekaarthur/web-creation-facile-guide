import { useState } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Composant de test pour vérifier le système de rôles
 * À utiliser uniquement en développement
 */
export const RoleTestPanel = () => {
  const { user, roles, primaryRole, hasRole, refreshRoles } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const testServerRole = async (role: UserRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-role', {
        body: { role }
      });

      if (error) throw error;
      return data?.hasRole === true;
    } catch (error) {
      console.error(`Error testing ${role}:`, error);
      return false;
    }
  };

  const runTests = async () => {
    setTesting(true);
    toast.info('Test en cours...', { description: 'Vérification des rôles côté serveur' });

    try {
      const results: Record<string, boolean> = {};
      
      // Tester chaque rôle
      for (const role of ['admin', 'provider', 'client', 'moderator', 'user'] as UserRole[]) {
        const hasRoleServer = await testServerRole(role);
        results[role] = hasRoleServer;
      }

      setTestResults(results);
      
      toast.success('Tests terminés', {
        description: 'Vérifiez les résultats ci-dessous'
      });
    } catch (error) {
      toast.error('Erreur de test', {
        description: 'Impossible de vérifier les rôles'
      });
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Panneau de Test des Rôles
        </CardTitle>
        <CardDescription>
          Vérification du système de sécurité et de cloisonnement des accès
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations utilisateur */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Utilisateur connecté:</span>
            <Badge variant="outline">{user.email}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rôle principal:</span>
            <Badge>{primaryRole || 'Aucun'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tous les rôles:</span>
            <div className="flex gap-2">
              {roles.length > 0 ? (
                roles.map(role => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))
              ) : (
                <Badge variant="destructive">Aucun rôle</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tests côté client */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Tests côté client (hasRole):</h4>
          <div className="grid grid-cols-2 gap-2">
            {['admin', 'provider', 'client', 'moderator', 'user'].map(role => (
              <div key={role} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{role}:</span>
                {hasRole(role as UserRole) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tests côté serveur */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Tests côté serveur (Edge Function):</h4>
            <Button 
              size="sm" 
              onClick={runTests}
              disabled={testing}
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Test...
                </>
              ) : (
                'Tester les rôles'
              )}
            </Button>
          </div>
          
          {Object.keys(testResults).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(testResults).map(([role, hasRole]) => (
                <div key={role} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{role}:</span>
                  {hasRole ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshRoles}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir les rôles
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>Test de cloisonnement:</strong></p>
          <p>1. Notez votre rôle actuel ci-dessus</p>
          <p>2. Essayez d'accéder aux URLs suivantes manuellement:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>/espace-personnel (clients)</li>
            <li>/espace-prestataire (providers)</li>
            <li>/modern-admin (admins)</li>
          </ul>
          <p>3. Vous devez être redirigé automatiquement selon votre rôle principal</p>
          <p className="text-primary font-medium mt-2">
            ✓ Le système doit empêcher tout accès non autorisé
          </p>
        </div>
      </CardContent>
    </Card>
  );
};