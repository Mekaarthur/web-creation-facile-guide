import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Shield, Users, Clock, LogIn, LogOut, UserPlus, UserMinus } from 'lucide-react';

interface AdminUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  role_granted_at: string;
}

interface AccessLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  description: string | null;
  created_at: string;
  ip_address: string | null;
  admin_email: string;
  new_data: any;
}

const AdminAccessTracking = () => {
  const [currentAdmins, setCurrentAdmins] = useState<AdminUser[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [roleLogs, setRoleLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load current admins
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'admin');

      const adminIds = roles?.map(r => r.user_id) || [];

      let adminsWithProfiles: AdminUser[] = [];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', adminIds);

        adminsWithProfiles = (roles || []).map(role => {
          const profile = profiles?.find(p => p.user_id === role.user_id);
          return {
            user_id: role.user_id,
            email: profile?.email || 'N/A',
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            role: role.role,
            role_granted_at: role.created_at,
          };
        });
      }
      setCurrentAdmins(adminsWithProfiles);

      // Load connection logs (login/logout)
      const { data: connLogs } = await supabase
        .from('admin_actions_log')
        .select('id, admin_user_id, action_type, description, created_at, ip_address, new_data')
        .in('action_type', ['login', 'logout'])
        .order('created_at', { ascending: false })
        .limit(200);

      const enrichedConnLogs = (connLogs || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null,
        description: log.description || '',
        admin_email: typeof log.new_data === 'object' && log.new_data !== null
          ? (log.new_data as any).admin_email || (log.new_data as any).email || 'Inconnu'
          : 'Inconnu',
      }));
      setAccessLogs(enrichedConnLogs);

      // Load role change logs
      const { data: roleChangeLogs } = await supabase
        .from('admin_actions_log')
        .select('id, admin_user_id, action_type, description, created_at, ip_address, new_data')
        .in('action_type', ['promote_admin', 'revoke_admin'])
        .order('created_at', { ascending: false })
        .limit(200);

      const enrichedRoleLogs = (roleChangeLogs || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null,
        description: log.description || '',
        admin_email: typeof log.new_data === 'object' && log.new_data !== null
          ? (log.new_data as any).admin_email || 'Inconnu'
          : 'Inconnu',
      }));
      setRoleLogs(enrichedRoleLogs);

    } catch (error) {
      console.error('Error loading access tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout': return <LogOut className="h-4 w-4 text-orange-600" />;
      case 'promote_admin': return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'revoke_admin': return <UserMinus className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'login': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connexion</Badge>;
      case 'logout': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Déconnexion</Badge>;
      case 'promote_admin': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Promotion</Badge>;
      case 'revoke_admin': return <Badge variant="destructive">Révocation</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Suivi des Accès Admin
        </h1>
        <p className="text-muted-foreground">
          Visualisez les administrateurs actuels, l'historique des connexions et les changements de rôles
        </p>
      </div>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Administrateurs Actuels ({currentAdmins.length})
          </CardTitle>
          <CardDescription>
            Personnes ayant actuellement accès au back-office
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Accès depuis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAdmins.map((admin) => (
                <TableRow key={admin.user_id}>
                  <TableCell className="font-medium">
                    {admin.first_name || admin.last_name
                      ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim()
                      : 'Non renseigné'}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      Administrateur
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {new Date(admin.role_granted_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {currentAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucun administrateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabs for logs */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Connexions ({accessLogs.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Changements de Rôles ({roleLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des Connexions
              </CardTitle>
              <CardDescription>
                Connexions et déconnexions des administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Administrateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Adresse IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune connexion enregistrée pour le moment.
                        Les prochaines connexions admin seront tracées ici.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium">{log.admin_email}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          {getActionIcon(log.action_type)}
                          {getActionBadge(log.action_type)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Historique des Changements de Rôles
              </CardTitle>
              <CardDescription>
                Promotions et révocations de rôles administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun changement de rôle enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    roleLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium">{log.admin_email}</TableCell>
                        <TableCell>
                          {getActionIcon(log.action_type)}
                          {getActionBadge(log.action_type)}
                        </TableCell>
                        <TableCell className="text-sm">{log.description}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAccessTracking;
