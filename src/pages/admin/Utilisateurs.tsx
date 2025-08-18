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
    avatar_url?: string | null;
  } | null;
  bookings?: any[];
  auth_data?: any;
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
      // Récupérer les profiles avec les auth users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          first_name,
          last_name,
          user_id,
          avatar_url
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesError) throw new Error(`[${profilesError.code}] Erreur profiles: ${profilesError.message}`);
      
      // Récupérer les emails depuis auth.users (si possible via admin API)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      const transformedUsers: User[] = profilesData?.map((profile: any) => {
        const authUser = authUsers.users?.find((u: any) => u.id === profile.user_id);
        return {
          id: profile.user_id,
          email: authUser?.email || 'Email non disponible',
          created_at: profile.created_at,
          profiles: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url
          }
        };
      }) || [];
      
      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error.message?.includes('[') 
        ? error.message 
        : `[500] Erreur inconnue: ${error.message || 'Impossible de charger les utilisateurs'}`;
      
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'examine') => {
    try {
      if (action === 'examine') {
        // Récupérer les détails complets de l'utilisateur avec ses bookings et activité
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select(`
            *,
            bookings:bookings!client_id (
              id, 
              status, 
              booking_date, 
              total_price,
              services (name)
            )
          `)
          .eq('user_id', userId)
          .single();

        if (userError) throw new Error(`[${userError.code}] ${userError.message}`);
        
        const authUser = await supabase.auth.admin.getUserById(userId);
        const fullUser: User = {
          id: userId,
          email: authUser.data.user?.email || 'Email non disponible',
          created_at: userData.created_at,
          profiles: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            avatar_url: userData.avatar_url
          },
          bookings: Array.isArray(userData.bookings) ? userData.bookings : [],
          auth_data: authUser.data.user
        };
        
        setSelectedUser(fullUser);
        return;
      }

      // Mettre à jour le statut utilisateur dans une table custom (si elle existe)
      const newStatus = action === 'activate' ? 'active' : 'suspended';
      
      // Désactiver l'utilisateur dans auth si suspension
      if (action === 'suspend') {
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '876000h' // 100 ans = suspension
        });
        
        if (authError && !authError.message.includes('already banned')) {
          throw new Error(`[${authError.status || 500}] Auth error: ${authError.message}`);
        }
      } else {
        // Réactiver l'utilisateur
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
        
        if (authError) {
          throw new Error(`[${authError.status || 500}] Auth error: ${authError.message}`);
        }
      }
      
      toast({
        title: "Action effectuée",
        description: `Utilisateur ${action === 'activate' ? 'activé' : 'suspendu'} avec succès`,
      });

      // Recharger la liste
      loadUsers();
    } catch (error: any) {
      console.error('Erreur action utilisateur:', error);
      const errorMsg = error.message?.includes('[') 
        ? error.message 
        : `[500] Erreur inconnue: ${error.message}`;
        
      toast({
        title: "Erreur d'action",
        description: errorMsg,
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
                            <div className="space-y-6 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                                  <p className="font-semibold">{getUserDisplayName(selectedUser)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                                  <p>{selectedUser.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                                  <p>{format(new Date(selectedUser.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Statut compte</label>
                                  <Badge variant={selectedUser.auth_data?.banned_until ? "destructive" : "default"}>
                                    {selectedUser.auth_data?.banned_until ? "Suspendu" : "Actif"}
                                  </Badge>
                                </div>
                              </div>
                              
                              {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Réservations récentes</label>
                                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                    {selectedUser.bookings.slice(0, 5).map((booking: any) => (
                                      <div key={booking.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                        <div>
                                          <p className="text-sm font-medium">{booking.services?.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: fr })}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <Badge variant="outline" className="text-xs">
                                            {booking.status}
                                          </Badge>
                                          <p className="text-sm font-semibold">{booking.total_price}€</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUserAction(selectedUser.id, selectedUser.auth_data?.banned_until ? 'activate' : 'suspend')}
                                >
                                  {selectedUser.auth_data?.banned_until ? 'Réactiver' : 'Suspendre'}
                                </Button>
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