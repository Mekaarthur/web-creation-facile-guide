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
  banned_until?: string | null;
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
      // Utiliser l'edge function pour récupérer les utilisateurs
      const { data, error } = await supabase.functions.invoke('admin-users-management', {
        body: { action: 'list' }
      });

      if (error) throw new Error(`[${error.status || 500}] ${error.message}`);
      
      const transformedUsers: User[] = data.users?.map((user: any) => {
        return {
          id: user.id,
          email: user.email || 'Email non disponible',
          created_at: user.created_at,
          banned_until: user.banned_until,
          profiles: user.profiles
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
        // Utiliser l'edge function pour récupérer les détails
        const { data, error } = await supabase.functions.invoke('admin-users-management', {
          body: { action: 'examine', userId }
        });

        if (error) throw new Error(`[${error.status || 500}] ${error.message}`);
        
        const fullUser: User = {
          id: data.user.id,
          email: data.user.email || 'Email non disponible',
          created_at: data.user.created_at,
          banned_until: data.user.banned_until,
          profiles: data.user.profiles,
          bookings: data.user.bookings || [],
          auth_data: { 
            banned_until: data.user.banned_until,
            email_confirmed_at: data.user.email_confirmed_at
          }
        };
        
        setSelectedUser(fullUser);
        return;
      }

      // Pour les actions d'activation/suspension
      const { data, error } = await supabase.functions.invoke('admin-users-management', {
        body: { action, userId }
      });

      if (error) throw new Error(`[${error.status || 500}] ${error.message}`);
      
      toast({
        title: "Action effectuée",
        description: data.message,
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
                    <Badge variant={user.banned_until ? "destructive" : "default"}>
                      {user.banned_until ? "Suspendu" : "Actif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
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
                                  <Badge variant={selectedUser.banned_until ? "destructive" : "default"}>
                                    {selectedUser.banned_until ? "Suspendu" : "Actif"}
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
                                  onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                                >
                                  Suspendre
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleUserAction(selectedUser.id, 'activate')}
                                >
                                  Réactiver
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