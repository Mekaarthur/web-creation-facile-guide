import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
  client?: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewSystemProps {
  bookingId?: string;
  providerId?: string;
  clientId?: string;
  mode: 'create' | 'view';
  onReviewSubmitted?: () => void;
}

async function fetchProviderReviews(providerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

const ReviewSystem = ({ bookingId, providerId, clientId, mode, onReviewSubmitted }: ReviewSystemProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', providerId],
    queryFn: () => fetchProviderReviews(providerId!),
    enabled: mode === 'view' && !!providerId,
  });

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const submitReview = async () => {
    if (!user || !bookingId || !providerId || !clientId) return;
    if (rating === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une note", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({ booking_id: bookingId, client_id: clientId, provider_id: providerId, rating, comment: comment.trim() || null });
      if (error) throw error;
      toast({ title: "Succès", description: "Votre avis a été publié" });
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de publier l'avis", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (r: number, interactive = false, size = 'w-5 h-5') => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} cursor-pointer transition-colors ${star <= r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          onClick={interactive ? () => setRating(star) : undefined}
        />
      ))}
    </div>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (mode === 'create') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Laisser un avis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Note (obligatoire)</label>
            {renderStars(rating, true, 'w-8 h-8')}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Commentaire (optionnel)</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Partagez votre expérience..." rows={4} />
          </div>
          <Button onClick={submitReview} disabled={submitting || rating === 0} className="w-full">
            {submitting ? 'Publication...' : "Publier l'avis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Avis clients
          </div>
          {reviews.length > 0 && (
            <Badge variant="secondary">{averageRating}/5 ({reviews.length} avis)</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Aucun avis pour le moment</div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium">Client</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSystem;
