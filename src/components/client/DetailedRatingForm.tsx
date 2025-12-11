import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send, Loader2, ThumbsUp, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DetailedRatingFormProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CRITERIA = [
  { id: 'punctuality', label: 'Ponctualité', icon: Clock },
  { id: 'quality', label: 'Qualité du service', icon: Sparkles },
  { id: 'professionalism', label: 'Professionnalisme', icon: ThumbsUp },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
];

const QUICK_FEEDBACK = [
  'Très professionnel',
  'Ponctuel',
  'Travail soigné',
  'Bonne communication',
  'Je recommande',
  'Sympathique',
  'Efficace',
  'À l\'écoute',
];

export const DetailedRatingForm = ({
  bookingId,
  providerId,
  providerName,
  serviceName,
  onSuccess,
  onCancel
}: DetailedRatingFormProps) => {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleCriteriaRating = (criteriaId: string, rating: number) => {
    setCriteriaRatings(prev => ({ ...prev, [criteriaId]: rating }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user || overallRating === 0) {
      toast.error('Veuillez donner une note globale');
      return;
    }

    setSubmitting(true);
    try {
      // Calculer la moyenne des critères
      const criteriaValues = Object.values(criteriaRatings);
      const avgCriteria = criteriaValues.length > 0 
        ? criteriaValues.reduce((a, b) => a + b, 0) / criteriaValues.length 
        : overallRating;

      // Construire le commentaire enrichi
      const enrichedComment = [
        comment,
        selectedTags.length > 0 ? `\n\nPoints forts: ${selectedTags.join(', ')}` : '',
        wouldRecommend ? `\nRecommandation: ${wouldRecommend === 'yes' ? 'Oui' : 'Non'}` : ''
      ].filter(Boolean).join('');

      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          provider_id: providerId,
          client_id: user.id,
          rating: overallRating,
          comment: enrichedComment,
          criteria_ratings: criteriaRatings,
          tags: selectedTags,
          would_recommend: wouldRecommend === 'yes'
        });

      if (error) throw error;

      // Mettre à jour la moyenne du prestataire
      await updateProviderRating(providerId);

      toast.success('Merci pour votre évaluation !');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur évaluation:', error);
      toast.error('Erreur lors de l\'envoi de l\'évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProviderRating = async (providerId: string) => {
    // Calculer la nouvelle moyenne - mise à jour simple via RPC ou trigger si disponible
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        console.log(`Provider ${providerId} - Nouvelle moyenne: ${avgRating} (${reviews.length} avis)`);
      }
    } catch (error) {
      console.error('Erreur mise à jour note prestataire:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Évaluez votre prestation</CardTitle>
        <CardDescription>
          {serviceName} avec {providerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Note globale */}
        <div className="text-center space-y-3">
          <Label className="text-lg font-medium">Note globale</Label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    (hoveredRating || overallRating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {overallRating === 0 && "Cliquez pour noter"}
            {overallRating === 1 && "Très insatisfait"}
            {overallRating === 2 && "Insatisfait"}
            {overallRating === 3 && "Correct"}
            {overallRating === 4 && "Satisfait"}
            {overallRating === 5 && "Très satisfait"}
          </p>
        </div>

        {/* Critères détaillés */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">Évaluation détaillée</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {CRITERIA.map((criteria) => (
              <div key={criteria.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <criteria.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{criteria.label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleCriteriaRating(criteria.id, star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          (criteriaRatings[criteria.id] || 0) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags rapides */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">Points forts (optionnel)</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_FEEDBACK.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Commentaire */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">Votre commentaire (optionnel)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Décrivez votre expérience..."
            className="min-h-[100px]"
          />
        </div>

        {/* Recommandation */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">Recommanderiez-vous ce prestataire ?</Label>
          <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="recommend-yes" />
              <Label htmlFor="recommend-yes" className="cursor-pointer">Oui, absolument</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="recommend-no" />
              <Label htmlFor="recommend-no" className="cursor-pointer">Non</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || overallRating === 0}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer mon avis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
