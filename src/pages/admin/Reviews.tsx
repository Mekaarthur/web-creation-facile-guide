import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Star,
  Eye,
  CheckCircle,
  X,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReviewDetailModal, getRatingStars, getStatusBadge, getRatingColor, type Review } from '@/components/admin/ReviewDetailModal';

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
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const { toast } = useToast();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    qc.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
  };

  useEffect(() => {
    const channel = supabase
      .channel('admin-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, invalidate)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const { data: reviews = [], isLoading: loading } = useQuery({
    queryKey: ['admin-reviews', ratingFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') {
        query = statusFilter === 'pending' ? query.or('status.eq.pending,status.is.null') : query.eq('status', statusFilter);
      }
      if (ratingFilter !== 'all') query = query.eq('rating', parseInt(ratingFilter));

      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) return [] as Review[];

      const clientIds = [...new Set(data.map(r => r.client_id))];
      const providerIds = [...new Set(data.map(r => r.provider_id))];
      const serviceIds = [...new Set(data.map(r => r.service_id).filter(Boolean))];

      const [clientsData, providersData, servicesData] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').in('id', clientIds),
        supabase.from('profiles').select('id, first_name, last_name').in('id', providerIds),
        serviceIds.length > 0 ? supabase.from('services').select('id, name, category').in('id', serviceIds) : Promise.resolve({ data: [] }),
      ]);

      const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c]));
      const providersMap = new Map((providersData.data || []).map(p => [p.id, p]));
      const servicesMap = new Map((servicesData.data || []).map(s => [s.id, s]));

      return data.map(review => ({
        ...review,
        status: (review.status || (review.is_approved ? 'published' : 'pending')) as Review['status'],
        client: clientsMap.get(review.client_id) || undefined,
        provider: providersMap.get(review.provider_id) || undefined,
        service: review.service_id ? servicesMap.get(review.service_id) : undefined,
      })) as Review[];
    },
    staleTime: 60 * 1000,
  });

  const { data: stats = null } = useQuery({
    queryKey: ['admin-reviews-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*');
      if (error) throw error;
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const all = data || [];
      const totalRating = all.reduce((sum, r) => sum + r.rating, 0);
      return {
        total_reviews: all.length,
        pending_reviews: all.filter(r => !r.status || r.status === 'pending').length,
        published_reviews: all.filter(r => r.status === 'published' || r.is_approved).length,
        rejected_reviews: all.filter(r => r.status === 'rejected').length,
        negative_reviews: all.filter(r => r.rating <= 2).length,
        positive_reviews: all.filter(r => r.rating >= 4).length,
        average_rating: all.length > 0 ? parseFloat((totalRating / all.length).toFixed(1)) : 0,
        reviews_last_7_days: all.filter(r => new Date(r.created_at) >= sevenDaysAgo).length,
        reviews_last_30_days: all.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length,
      } as ReviewStats;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleApproveReview = async (reviewId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('reviews').update({
        status: 'published',
        is_approved: true,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        admin_notes: notes || null,
      }).eq('id', reviewId);
      if (error) throw error;

      toast({ title: "Avis approuvé", description: "L'avis est maintenant publié" });

      await supabase.functions.invoke('create-admin-notification', {
        body: {
          type: 'system',
          title: '✅ Avis approuvé',
          message: `Un avis a été approuvé et publié`,
          data: { review_id: reviewId },
          priority: 'low',
        },
      });

      setSelectedReview(null);
      invalidate();
    } catch {
      toast({ title: "Erreur", description: "Impossible d'approuver l'avis", variant: "destructive" });
    }
  };

  const handleRejectReview = async (reviewId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('reviews').update({
        status: 'rejected',
        is_approved: false,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        admin_notes: notes || null,
      }).eq('id', reviewId);
      if (error) throw error;

      toast({ title: "Avis rejeté", description: "L'avis a été rejeté" });
      setSelectedReview(null);
      invalidate();
    } catch {
      toast({ title: "Erreur", description: "Impossible de rejeter l'avis", variant: "destructive" });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('reviews').update({
        status: 'deleted',
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      }).eq('id', reviewId);
      if (error) throw error;

      toast({ title: "Avis supprimé", description: "L'avis a été supprimé définitivement" });
      setSelectedReview(null);
      invalidate();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer l'avis", variant: "destructive" });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const clientName = review.client ? `${review.client.first_name} ${review.client.last_name}` : '';
    const providerName = review.provider ? `${review.provider.first_name} ${review.provider.last_name}` : '';
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.service?.name && review.service.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recherche et filtres</CardTitle>
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['admin-reviews'] })}>
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
                          {review.client ? `${review.client.first_name} ${review.client.last_name}` : 'Client'}
                        </p>
                        {review.client?.email && (
                          <p className="text-xs text-muted-foreground">{review.client.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {review.provider ? `${review.provider.first_name} ${review.provider.last_name}` : 'Prestataire'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {review.service ? (
                        <div>
                          <p className="text-sm font-medium">{review.service.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">{review.service.category}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">{getRatingStars(review.rating)}</div>
                        <p className={`text-sm font-bold ${getRatingColor(review.rating)}`}>{review.rating}/5</p>
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
                          onClick={() => setSelectedReview(review)}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(review.status === 'pending' || (!review.status && !review.is_approved)) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveReview(review.id, '')}
                              title="Approuver"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReview(review)}
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

      <ReviewDetailModal
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onApprove={handleApproveReview}
        onReject={handleRejectReview}
        onDelete={handleDeleteReview}
      />
    </div>
  );
}
