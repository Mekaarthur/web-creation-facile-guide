import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, Flag, User } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_verified: boolean;
  helpful_count: number;
  is_flagged: boolean;
  booking: {
    id: string;
    service: {
      name: string;
    };
  };
  client: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface ReviewSystemProps {
  providerId?: string;
  bookingId?: string;
  mode: 'display' | 'create';
}

export const ReviewSystem = ({ providerId, bookingId, mode }: ReviewSystemProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Charger les avis pour un prestataire
  useEffect(() => {
    if (providerId && mode === 'display') {
      loadReviews();
    }
  }, [providerId, mode]);

  const loadReviews = async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          booking:bookings(
            id,
            service:services(name)
          ),
          client:profiles!reviews_client_id_fkey(first_name, last_name)
        `)
        .eq('provider_id', providerId)
        .eq('is_moderated', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
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
    if (!bookingId || !comment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await (supabase as any)
        .from('reviews')
        .insert([{
          booking_id: bookingId,
          rating,
          comment: comment.trim(),
          client_id: user.id,
          provider_id: providerId
        }]);

      if (error) throw error;

      toast({
        title: "Avis envoyé",
        description: "Votre avis a été envoyé et sera modéré avant publication",
      });

      setIsDialogOpen(false);
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'avis:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'avis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsHelpful = async (reviewId: string) => {
    try {
      const { error } = await (supabase as any)
        .rpc('increment_helpful_count', { review_id: reviewId });

      if (error) throw error;
      
      // Recharger les avis
      loadReviews();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const flagReview = async (reviewId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Signalement envoyé",
        description: "Ce commentaire a été signalé pour modération",
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  const getClientDisplayName = (client: any) => {
    if (client?.first_name && client?.last_name) {
      return `${client.first_name} ${client.last_name.charAt(0)}.`;
    }
    return "Client anonyme";
  };

  if (mode === 'create') {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Star className="w-4 h-4 mr-2" />
            Laisser un avis
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Évaluer cette prestation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              {renderStars(rating, true, setRating)}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Commentaire</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={4}
              />
            </div>
            
            <Button 
              onClick={submitReview} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Envoi...' : 'Publier l\'avis'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mode affichage
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Résumé des avis */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Avis clients</span>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <Badge variant="secondary">{reviews.length} avis</Badge>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Liste des avis */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun avis pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header de l'avis */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getClientDisplayName(review.client)}</p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          {review.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              Avis vérifié
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>

                  {/* Service concerné */}
                  {review.booking?.service && (
                    <Badge variant="outline" className="text-xs">
                      {review.booking.service.name}
                    </Badge>
                  )}

                  {/* Commentaire */}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsHelpful(review.id)}
                      className="text-xs"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Utile ({review.helpful_count})
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => flagReview(review.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      Signaler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};