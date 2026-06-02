import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, MessageSquare, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface ReviewSystemProps {
  providerId?: string;
  bookingId?: string;
  showAddReview?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  client_id: string;
  created_at: string;
  is_approved: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  };
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

export const ReviewAndRatingSystem = ({ providerId, bookingId, showAddReview = false }: ReviewSystemProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews-provider', providerId],
    queryFn: () => fetchProviderReviews(providerId!),
    enabled: !!providerId,
  });

  const stats = useMemo(() => {
    if (reviews.length === 0) return { averageRating: 0, totalReviews: 0, ratingDistribution: [0, 0, 0, 0, 0] };
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => { distribution[r.rating - 1]++; });
    return { averageRating: totalRating / reviews.length, totalReviews: reviews.length, ratingDistribution: distribution };
  }, [reviews]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Connexion requise", description: "Veuillez vous connecter pour laisser un avis" });
      return;
    }
    if (rating === 0) {
      toast({ variant: "destructive", title: "Note requise", description: "Veuillez donner une note entre 1 et 5 étoiles" });
      return;
    }
    if (!bookingId || !providerId) {
      toast({ variant: "destructive", title: "Erreur", description: "Informations manquantes pour soumettre l'avis" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId, client_id: user.id, provider_id: providerId,
        rating, comment: comment.trim(), is_approved: true
      });
      if (error) throw error;
      toast({ title: "Avis soumis", description: "Merci pour votre avis ! Il apparaîtra après modération." });
      setRating(0);
      setComment('');
      qc.invalidateQueries({ queryKey: ['reviews-provider', providerId] });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de soumettre votre avis" });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating: r, interactive = false, size = 'md' as 'sm' | 'md' | 'lg', onRatingChange }: {
    rating: number; interactive?: boolean; size?: 'sm' | 'md' | 'lg'; onRatingChange?: (r: number) => void;
  }) => {
    const sizeClasses = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-6 w-6' };
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= (interactive ? hoverRating || r : r) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <AnimatedCard className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Avis et évaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton className="h-24" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stats.averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(stats.averageRating)} />
                <div className="text-sm text-muted-foreground mt-1">{stats.totalReviews} avis</div>
              </div>
              <div className="col-span-2">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm">{stars}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: stats.totalReviews > 0 ? `${(stats.ratingDistribution[stars - 1] / stats.totalReviews) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{stats.ratingDistribution[stars - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </AnimatedCard>

      {showAddReview && user && (
        <AnimatedCard className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Laisser un avis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Votre note</label>
              <StarRating rating={rating} interactive size="lg" onRatingChange={setRating} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Votre commentaire</label>
              <Textarea
                placeholder="Partagez votre expérience avec ce prestataire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleSubmitReview} disabled={submitting || rating === 0} className="w-full">
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Publier mon avis
                </div>
              )}
            </Button>
          </CardContent>
        </AnimatedCard>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Avis des clients ({stats.totalReviews})</h3>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-32" />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <AnimatedCard key={review.id} className="animate-fade-in-up">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">CL</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Client vérifié</div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <div className="text-sm text-muted-foreground">{formatDate(review.created_at)}</div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <AnimatedCard className="animate-fade-in">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun avis pour ce prestataire pour le moment</p>
            </CardContent>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
};
