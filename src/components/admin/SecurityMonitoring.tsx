import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RoleStats {
  role: string;
  count: number;
}

interface SecurityAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export const SecurityMonitoring = () => {
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Statistiques par rôle
      const { data: stats, error: statsError } = await supabase
        .from('user_roles')
        .select('role');

      if (statsError) throw statsError;

      // Compter les rôles
      const roleCounts: Record<string, number> = {};
      stats?.forEach(item => {
        roleCounts[item.role] = (roleCounts[item.role] || 0) + 1;
      });

      const statsArray = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count
      }));

      setRoleStats(statsArray);

      // Vérifications de sécurité
      const securityAlerts: SecurityAlert[] = [];

      // Vérifier les providers sans rôle provider
      const { data: providersData } = await supabase
        .from('providers')
        .select('user_id')
        .not('user_id', 'is', null);

      const { data: providerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'provider');

      const providersWithoutRole = providersData?.filter(p => 
        !providerRoles?.some(pr => pr.user_id === p.user_id)
      ) || [];

      if (providersWithoutRole.length > 0) {
        securityAlerts.push({
          type: 'providers_without_role',
          message: `${providersWithoutRole.length} prestataire(s) sans rôle provider`,
          severity: 'error'
        });
      }

      if (securityAlerts.length === 0) {
        securityAlerts.push({
          type: 'all_good',
          message: 'Aucune anomalie détectée',
          severity: 'info'
        });
      }

      setAlerts(securityAlerts);
    } catch (error: any) {
      console.error('Error loading security data:', error);
      toast.error('Erreur', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-destructive bg-destructive/5';
      case 'warning': return 'border-warning bg-warning/5';
      default: return 'border-success bg-success/5';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Monitoring de Sécurité
              </CardTitle>
              <CardDescription>
                Surveillance en temps réel du système de rôles et permissions
              </CardDescription>
            </div>
            <Button 
              onClick={loadSecurityData} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques par rôle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Répartition des Rôles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roleStats.map(stat => (
              <div key={stat.role} className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.count}
                </div>
                <Badge variant="secondary" className="uppercase">
                  {stat.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes de Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border-2 flex items-start gap-3 ${getSeverityColor(alert.severity)}`}
                >
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {alert.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => {
              toast.info('Consultation des rôles', {
                description: 'Voir SECURITY_ROLES_SYSTEM.md pour plus de détails'
              });
            }}>
              📖 Documentation Système
            </Button>
            <Button variant="outline" onClick={() => {
              window.open('https://supabase.com/dashboard/project/cgrosjzmbgxmtvwxictr/auth/users', '_blank');
            }}>
              🔐 Gestion des Utilisateurs Supabase
            </Button>
            <Button variant="outline" onClick={() => {
              toast.info('Tests de sécurité', {
                description: 'Voir TESTS_SECURITE.md pour la procédure complète'
              });
            }}>
              🧪 Guide de Tests
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke('verify-user-role', {
                  body: { role: 'admin' }
                });
                if (error) throw error;
                toast.success('Test Edge Function', {
                  description: `Rôle admin: ${data.hasRole ? 'Validé ✅' : 'Refusé ❌'}`
                });
              } catch (error) {
                toast.error('Erreur de test');
              }
            }}>
              🧪 Test Vérification Rôle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};