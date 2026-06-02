import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, MessageSquare, Clock, Award, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DetailedReview {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  punctuality_rating: number;
  quality_rating: number;
  comment: string;
  created_at: string;
  is_approved: boolean;
}

interface DetailedReviewProps {
  bookingId?: string;
  providerId?: string;
  clientId?: string;
  mode: 'create' | 'view';
  onReviewSubmitted?: () => void;
}

const DetailedReviewSystem: React.FC<DetailedReviewProps> = ({
  bookingId,
  providerId,
  clientId,
  mode,
  onReviewSubmitted
}) => {
  const [ratings, setRatings] = useState({
    general: 0,
    punctuality: 0,
    quality: 0
  });
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<DetailedReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (mode === 'view' && providerId) {
      loadReviews();
    }
  }, [mode, providerId]);

  const loadReviews = async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || !bookingId || !providerId || !clientId) return;
    
    const { general, punctuality, quality } = ratings;
    
    if (general === 0 || punctuality === 0 || quality === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez noter tous les critères",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          client_id: clientId,
          provider_id: providerId,
          rating: general,
          punctuality_rating: punctuality,
          quality_rating: quality,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre évaluation a été publiée",
      });

      setRatings({ general: 0, punctuality: 0, quality: 0 });
      setComment('');
      onReviewSubmitted?.();

    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier l'évaluation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, type: 'general' | 'punctuality' | 'quality', interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} transition-colors ${
              interactive ? 'cursor-pointer' : ''
            } ${
              star <= rating
                ? 'fill-primary text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
            onClick={interactive ? () => setRatings(prev => ({ ...prev, [type]: star })) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAverageRatings = () => {
    if (reviews.length === 0) return { general: 0, punctuality: 0, quality: 0, overall: 0 };
    
    const totals = reviews.reduce((acc, review) => ({
      general: acc.general + review.rating,
      punctuality: acc.punctuality + (review.punctuality_rating || review.rating),
      quality: acc.quality + (review.quality_rating || review.rating)
    }), { general: 0, punctuality: 0, quality: 0 });
    
    const count = reviews.length;
    const general = totals.general / count;
    const punctuality = totals.punctuality / count;
    const quality = totals.quality / count;
    const overall = (general + punctuality + quality) / 3;
    
    return { 
      general: parseFloat(general.toFixed(1)), 
      punctuality: parseFloat(punctuality.toFixed(1)), 
      quality: parseFloat(quality.toFixed(1)),
      overall: parseFloat(overall.toFixed(1))
    };
  };

  const getRatingDistribution = (type: 'rating' | 'punctuality_rating' | 'quality_rating') => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = type === 'rating' ? review.rating : 
                    type === 'punctuality_rating' ? (review.punctuality_rating || review.rating) :
                    (review.quality_rating || review.rating);
      distribution[rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (mode === 'create') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Évaluation détaillée du service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium">
                  Satisfaction générale (obligatoire)
                </label>
              </div>
              {renderStars(ratings.general, 'general', true, 'w-6 h-6')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium">
                  Ponctualité (obligatoire)
                </label>
              </div>
              {renderStars(ratings.punctuality, 'punctuality', true, 'w-6 h-6')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium">
                  Qualité du service (obligatoire)
                </label>
              </div>
              {renderStars(ratings.quality, 'quality', true, 'w-6 h-6')}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience en détail..."
              rows={4}
            />
          </div>

          <Button 
            onClick={submitReview}
            disabled={submitting || ratings.general === 0 || ratings.punctuality === 0 || ratings.quality === 0}
            className="w-full"
          >
            {submitting ? 'Publication...' : 'Publier l\'évaluation'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const averages = getAverageRatings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Évaluations clients
          </div>
          {reviews.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {averages.overall}/5 ({reviews.length} avis)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucune évaluation pour le moment
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé des notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Général</span>
                </div>
                <div className="flex justify-center mb-1">
                  {renderStars(Math.round(averages.general), 'general')}
                </div>
                <span className="text-sm text-muted-foreground">{averages.general}/5</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Ponctualité</span>
                </div>
                <div className="flex justify-center mb-1">
                  {renderStars(Math.round(averages.punctuality), 'punctuality')}
                </div>
                <span className="text-sm text-muted-foreground">{averages.punctuality}/5</span>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Qualité</span>
                </div>
                <div className="flex justify-center mb-1">
                  {renderStars(Math.round(averages.quality), 'quality')}
                </div>
                <span className="text-sm text-muted-foreground">{averages.quality}/5</span>
              </div>
            </div>

            {/* Liste des avis */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-l-4 border-primary/20 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {renderStars(review.rating, 'general', false, 'w-3 h-3')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {renderStars(review.punctuality_rating || review.rating, 'punctuality', false, 'w-3 h-3')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {renderStars(review.quality_rating || review.rating, 'quality', false, 'w-3 h-3')}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Client vérifié</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm bg-background p-3 rounded border">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetailedReviewSystem;