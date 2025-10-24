import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, UserMinus, Search, Download, Users, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

const AdminRoles = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'revoke' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .order('email');

      if (usersError) throw usersError;

      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge users with roles
      const usersWithRoles = usersData?.map(user => ({
        ...user,
        role: rolesData?.find(r => r.user_id === user.user_id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
      setAdmins(usersWithRoles.filter(u => u.role === 'admin'));
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'promote', targetUserId: selectedUser.user_id }
      });

      if (error) throw error;

      toast({
        title: '✅ Promotion réussie',
        description: `${selectedUser.email} est maintenant administrateur`,
      });

      await loadData();
      setSelectedUser(null);
      setActionType(null);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la promotion',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'revoke', targetUserId: selectedUser.user_id }
      });

      if (error) throw error;

      toast({
        title: '✅ Révocation réussie',
        description: `${selectedUser.email} n'est plus administrateur`,
      });

      await loadData();
      setSelectedUser(null);
      setActionType(null);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la révocation',
        variant: 'destructive',
      });
    }
  };

  const exportAdmins = () => {
    const csv = admins.map(admin => 
      `${admin.email},${admin.first_name || ''},${admin.last_name || ''}`
    ).join('\n');
    
    const blob = new Blob([`Email,Prénom,Nom\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestion des Rôles Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les droits d'administration de votre équipe
          </p>
        </div>
        <Button onClick={exportAdmins} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{admins.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Standards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length - admins.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Warning */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-4 w-4" />
            Avertissement de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Vous ne pouvez pas modifier votre propre rôle</li>
            <li>Vous ne pouvez pas révoquer le dernier administrateur</li>
            <li>Toutes les actions sont enregistrées dans les logs Supabase</li>
          </ul>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Recherchez et gérez les rôles des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="default" className="bg-primary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Utilisateur</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role === 'admin' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('revoke');
                        }}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Révoquer
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('promote');
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Promouvoir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? 'Promouvoir en Admin' : 'Révoquer Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote' ? (
                <>
                  Êtes-vous sûr de vouloir promouvoir <strong>{selectedUser?.email}</strong> en administrateur ?
                  Cette personne aura accès à toutes les fonctionnalités d'administration.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir révoquer les droits d'administrateur de <strong>{selectedUser?.email}</strong> ?
                  Cette personne n'aura plus accès aux fonctionnalités d'administration.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedUser(null);
              setActionType(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'promote' ? handlePromote : handleRevoke}
              className={actionType === 'revoke' ? 'bg-destructive' : ''}
            >
              {actionType === 'promote' ? 'Promouvoir' : 'Révoquer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRoles;
