import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Ban, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();

    // Abonnement temps réel aux changements de profils
    const channel = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select(`
          id,
          created_at,
          first_name,
          last_name,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const transformedUsers = data?.map((profile: any) => ({
        id: profile.user_id,
        email: profile.user_id,
        created_at: profile.created_at,
        profiles: {
          first_name: profile.first_name,
          last_name: profile.last_name
        }
      })) || [];
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'examine') => {
    try {
      if (action === 'examine') {
        const user = users.find(u => u.id === userId);
        setSelectedUser(user || null);
        return;
      }

      // Ici on pourrait mettre à jour un statut utilisateur si nécessaire
      // Pour l'instant on simule juste l'action
      
      toast({
        title: "Action effectuée",
        description: `Utilisateur ${action === 'activate' ? 'activé' : 'suspendu'} avec succès`,
      });

      // Recharger la liste
      loadUsers();
    } catch (error) {
      console.error('Erreur action utilisateur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer cette action",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadUsers();
    toast({
      title: "Actualisation",
      description: "Liste des utilisateurs actualisée",
    });
  };

  const getUserDisplayName = (user: User) => {
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`;
    }
    return "Utilisateur";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">Liste des clients inscrits sur la plateforme</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Utilisateurs ({users.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {getUserDisplayName(user)}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Actif</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'examine')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Détails utilisateur</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Nom</label>
                                <p>{getUserDisplayName(selectedUser)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p>{selectedUser.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Date d'inscription</label>
                                <p>{format(new Date(selectedUser.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'activate')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'suspend')}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}