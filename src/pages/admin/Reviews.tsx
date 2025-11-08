import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Star,
  Eye,
  CheckCircle,
  X,
  Trash2,
  Edit3,
  RefreshCw,
  Filter,
  TrendingUp,
  AlertTriangle,
  Award,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string | null;
  booking_id: string;
  rating: number;
  comment: string | null;
  status: 'pending' | 'published' | 'rejected' | 'deleted';
  admin_notes: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  punctuality_rating?: number;
  quality_rating?: number;
  is_approved?: boolean;
  client?: { first_name: string; last_name: string; email: string };
  provider?: { first_name: string; last_name: string };
  service?: { name: string; category: string };
}

interface ReviewStats {
  total_reviews: number;
  pending_reviews: number;
  published_reviews: number;
  rejected_reviews: number;
  negative_reviews: number;
  positive_reviews: number;
  average_rating: number;
  reviews_last_7_days: number;
  reviews_last_30_days: number;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
    loadStats();

    // Real-time subscriptions
    const channel = supabase
      .channel('admin-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        loadReviews();
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ratingFilter, statusFilter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(first_name, last_name, email),
          provider:profiles!reviews_provider_id_fkey(first_name, last_name),
          service:services(name, category)
        `)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          query = query.or('status.eq.pending,status.is.null');
        } else {
          query = query.eq('status', statusFilter);
        }
      }
      
      if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter);
        query = query.eq('rating', rating);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Normaliser les données (gérer l'ancien champ is_approved)
      const normalizedData = (data || []).map(review => ({
        ...review,
        status: (review.status || (review.is_approved ? 'published' : 'pending')) as 'pending' | 'published' | 'rejected' | 'deleted'
      }));
      
      setReviews(normalizedData);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculer les stats manuellement si la vue n'existe pas encore
      const { data, error } = await supabase
        .from('reviews')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const allReviews = data || [];
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);

      setStats({
        total_reviews: allReviews.length,
        pending_reviews: allReviews.filter(r => !r.status || r.status === 'pending').length,
        published_reviews: allReviews.filter(r => r.status === 'published' || r.is_approved).length,
        rejected_reviews: allReviews.filter(r => r.status === 'rejected').length,
        negative_reviews: allReviews.filter(r => r.rating <= 2).length,
        positive_reviews: allReviews.filter(r => r.rating >= 4).length,
        average_rating: allReviews.length > 0 ? parseFloat((totalRating / allReviews.length).toFixed(1)) : 0,
        reviews_last_7_days: allReviews.filter(r => new Date(r.created_at) >= sevenDaysAgo).length,
        reviews_last_30_days: allReviews.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'published',
          is_approved: true,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          admin_notes: moderationNotes || null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Avis approuvé",
        description: "L'avis est maintenant publié"
      });

      // Notification admin
      await supabase.functions.invoke('create-admin-notification', {
        body: {
          type: 'system',
          title: '✅ Avis approuvé',
          message: `Un avis a été approuvé et publié`,
          data: { review_id: reviewId },
          priority: 'low'
        }
      });

      setSelectedReview(null);
      setModerationNotes('');
      loadReviews();
      loadStats();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'avis",
        variant: "destructive"
      });
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'rejected',
          is_approved: false,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          admin_notes: moderationNotes || null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Avis rejeté",
        description: "L'avis a été rejeté"
      });

      setSelectedReview(null);
      setModerationNotes('');
      loadReviews();
      loadStats();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'avis",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('reviews')
        .update({
          status: 'deleted',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Avis supprimé",
        description: "L'avis a été supprimé définitivement"
      });

      setSelectedReview(null);
      loadReviews();
      loadStats();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'avis",
        variant: "destructive"
      });
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200">🟡 En attente</Badge>;
      case 'published':
        return <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">🟢 Publié</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200">🔴 Rejeté</Badge>;
      case 'deleted':
        return <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">⚪ Supprimé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600';
    if (rating === 3) return 'text-orange-600';
    return 'text-green-600';
  };

  const filteredReviews = reviews.filter(review => {
    const clientName = review.client 
      ? `${review.client.first_name} ${review.client.last_name}` 
      : '';
    const providerName = review.provider 
      ? `${review.provider.first_name} ${review.provider.last_name}` 
      : '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.service?.name && review.service.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">⭐ Avis & Notes</h1>
        <p className="text-muted-foreground">Modération et analyse de la satisfaction client</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-600" />
                Moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                {stats.average_rating || 0}
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground">Note globale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_reviews}</div>
              <p className="text-xs text-muted-foreground">À modérer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Publiés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published_reviews}</div>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Positifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.positive_reviews}</div>
              <p className="text-xs text-muted-foreground">≥ 4 étoiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Négatifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.negative_reviews}</div>
              <p className="text-xs text-muted-foreground">≤ 2 étoiles</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recherche et filtres</CardTitle>
            <Button variant="outline" size="sm" onClick={loadReviews}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher client, prestataire, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                <SelectItem value="2">⭐⭐ (2)</SelectItem>
                <SelectItem value="1">⭐ (1)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des avis */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Prestataire</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Note ⭐</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun avis trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review, index) => (
                  <TableRow 
                    key={review.id}
                    className={review.status === 'pending' || (!review.status && !review.is_approved) ? 'bg-yellow-50/30 dark:bg-yellow-950/20' : ''}
                  >
                    <TableCell className="font-mono text-xs">
                      {String(index + 1).padStart(3, '0')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">
                          {review.client 
                            ? `${review.client.first_name} ${review.client.last_name}` 
                            : 'Client'}
                        </p>
                        {review.client?.email && (
                          <p className="text-xs text-muted-foreground">{review.client.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {review.provider 
                          ? `${review.provider.first_name} ${review.provider.last_name}` 
                          : 'Prestataire'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {review.service ? (
                        <div>
                          <p className="text-sm font-medium">{review.service.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {review.service.category}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {getRatingStars(review.rating)}
                        </div>
                        <p className={`text-sm font-bold ${getRatingColor(review.rating)}`}>
                          {review.rating}/5
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 max-w-xs">
                        {review.comment || <span className="text-muted-foreground italic">Aucun commentaire</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(review.status || (review.is_approved ? 'published' : 'pending'))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setModerationNotes(review.admin_notes || '');
                          }}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(review.status === 'pending' || (!review.status && !review.is_approved)) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveReview(review.id)}
                              title="Approuver"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review);
                                setModerationNotes('');
                              }}
                              title="Rejeter"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Supprimer définitivement"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'avis</DialogTitle>
              <DialogDescription>
                {getStatusBadge(selectedReview.status || (selectedReview.is_approved ? 'published' : 'pending'))}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info client/prestataire */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Client</p>
                    <p className="font-semibold">
                      {selectedReview.client 
                        ? `${selectedReview.client.first_name} ${selectedReview.client.last_name}` 
                        : 'Client'}
                    </p>
                    {selectedReview.client?.email && (
                      <p className="text-xs text-muted-foreground">{selectedReview.client.email}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Prestataire</p>
                    <p className="font-semibold">
                      {selectedReview.provider 
                        ? `${selectedReview.provider.first_name} ${selectedReview.provider.last_name}` 
                        : 'Prestataire'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Note et commentaire */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Évaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Note globale</p>
                    <div className="flex items-center gap-2">
                      {getRatingStars(selectedReview.rating)}
                      <span className={`text-xl font-bold ${getRatingColor(selectedReview.rating)}`}>
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </div>

                  {selectedReview.punctuality_rating && (
                    <div>
                      <p className="text-sm font-medium mb-2">Ponctualité</p>
                      <div className="flex items-center gap-2">
                        {getRatingStars(selectedReview.punctuality_rating)}
                        <span className="text-sm">{selectedReview.punctuality_rating}/5</span>
                      </div>
                    </div>
                  )}

                  {selectedReview.quality_rating && (
                    <div>
                      <p className="text-sm font-medium mb-2">Qualité du travail</p>
                      <div className="flex items-center gap-2">
                        {getRatingStars(selectedReview.quality_rating)}
                        <span className="text-sm">{selectedReview.quality_rating}/5</span>
                      </div>
                    </div>
                  )}

                  {selectedReview.comment && (
                    <div>
                      <p className="text-sm font-medium mb-2">Commentaire</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm italic">"{selectedReview.comment}"</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes de modération */}
              <div>
                <label className="text-sm font-medium mb-2 block">Notes de modération (privées)</label>
                <Textarea
                  placeholder="Raison de l'approbation/rejet..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              {(selectedReview.status === 'pending' || (!selectedReview.status && !selectedReview.is_approved)) && (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApproveReview(selectedReview.id)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver et publier
                  </Button>
                  <Button
                    onClick={() => handleRejectReview(selectedReview.id)}
                    className="flex-1"
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Créé le {format(new Date(selectedReview.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                {selectedReview.moderated_at && (
                  <p>Modéré le {format(new Date(selectedReview.moderated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
