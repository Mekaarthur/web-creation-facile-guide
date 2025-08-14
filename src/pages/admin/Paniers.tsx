import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, ShoppingCart, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cart {
  id: string;
  total_estimated: number;
  status: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  cart_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    services: {
      name: string;
    };
  }>;
}

export default function AdminPaniers() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expireReason, setExpireReason] = useState('');
  const { toast } = useToast();

  const loadCarts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-carts', {
        body: {
          filters: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: searchTerm || undefined
          }
        }
      });

      if (error) throw error;

      setCarts(data.carts);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paniers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCartAction = async (action: string, cartId: string, extraData?: any) => {
    try {
      setActionLoading(cartId);
      
      const { data, error } = await supabase.functions.invoke('admin-carts', {
        body: {
          action,
          cartId,
          ...extraData
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Action ${action} effectuée avec succès`,
      });

      loadCarts();
      setSelectedCart(null);
      setExpireReason('');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'effectuer l'action ${action}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const expireOldCarts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-carts', {
        body: { action: 'expire-old' }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${data.expiredCount} paniers expirés automatiquement`,
      });

      loadCarts();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'expirer les anciens paniers",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCarts();
  }, [statusFilter, searchTerm]);

  const filteredCarts = carts.filter(cart => {
    const clientName = cart.profiles ? `${cart.profiles.first_name} ${cart.profiles.last_name}` : '';
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cart.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Actif</Badge>;
      case 'validé':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validé</Badge>;
      case 'expiré':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expiré</Badge>;
      case 'annulé':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'payé':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Payé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: carts.length,
    active: carts.filter(c => c.status === 'active').length,
    validé: carts.filter(c => c.status === 'validé').length,
    expiré: carts.filter(c => c.status === 'expiré').length,
    payé: carts.filter(c => c.status === 'payé').length,
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return expiryTime - now < oneHour && expiryTime > now;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des paniers</h1>
        <p className="text-muted-foreground">Suivi des paniers clients et validation des commandes</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Paniers actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.active}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Validés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.validé}</div>
            <p className="text-xs text-muted-foreground">Prêts pour paiement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Expirés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.expiré}</div>
            <p className="text-xs text-muted-foreground">Non finalisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              Payés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{statusCounts.payé}</div>
            <p className="text-xs text-muted-foreground">Finalisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche et actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par client, ID panier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="validé">Validés</option>
              <option value="expiré">Expirés</option>
              <option value="payé">Payés</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadCarts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={expireOldCarts}>
              <Clock className="w-4 h-4 mr-2" />
              Expirer anciens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paniers */}
      <Card>
        <CardContent className="p-0">
          {filteredCarts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun panier trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant estimé</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.map((cart) => {
                  const clientName = cart.profiles 
                    ? `${cart.profiles.first_name} ${cart.profiles.last_name}`
                    : 'N/A';
                  
                  const expiringSoon = isExpiringSoon(cart.expires_at);
                  
                  return (
                    <TableRow key={cart.id} className={expiringSoon ? 'bg-orange-50' : ''}>
                      <TableCell className="font-medium">{clientName}</TableCell>
                      <TableCell>€{cart.total_estimated.toFixed(2)}</TableCell>
                      <TableCell>{cart.cart_items.length} article(s)</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(cart.status)}
                          {expiringSoon && <AlertCircle className="w-4 h-4 text-orange-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={expiringSoon ? 'text-orange-600 font-medium' : ''}>
                          {new Date(cart.expires_at).toLocaleString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(cart.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCart(cart)}
                              >
                                Détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails du panier</DialogTitle>
                                <DialogDescription>
                                  Panier #{selectedCart?.id.slice(0, 8)} - {clientName}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCart && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Total estimé:</span> €{selectedCart.total_estimated.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Statut:</span> {getStatusBadge(selectedCart.status)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Expire le:</span> {new Date(selectedCart.expires_at).toLocaleString('fr-FR')}
                                    </div>
                                    <div>
                                      <span className="font-medium">Créé le:</span> {new Date(selectedCart.created_at).toLocaleString('fr-FR')}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Articles du panier:</h4>
                                    <div className="space-y-2">
                                      {selectedCart.cart_items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                          <div>
                                            <span className="font-medium">{item.services.name}</span>
                                            <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                          </div>
                                          <span>€{item.total_price.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    {selectedCart.status === 'active' && (
                                      <>
                                        <Button
                                          onClick={() => handleCartAction('validate', selectedCart.id)}
                                          disabled={actionLoading === selectedCart.id}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Valider panier
                                        </Button>
                                        
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="destructive" disabled={actionLoading === selectedCart.id}>
                                              <Clock className="w-4 h-4 mr-2" />
                                              Expirer
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Expirer le panier</DialogTitle>
                                              <DialogDescription>
                                                Pourquoi souhaitez-vous expirer ce panier ?
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <Textarea
                                                placeholder="Raison de l'expiration..."
                                                value={expireReason}
                                                onChange={(e) => setExpireReason(e.target.value)}
                                              />
                                              <Button
                                                variant="destructive"
                                                onClick={() => handleCartAction('expire', selectedCart.id, { reason: expireReason })}
                                                disabled={actionLoading === selectedCart.id}
                                              >
                                                Confirmer l'expiration
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}