import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, X, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type FeedbackType = 'positive' | 'negative' | null;
type FeedbackStep = 'initial' | 'rating' | 'comment' | 'thanks';

const STORAGE_KEY = 'bikawo-feedback-state';

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<FeedbackStep>('initial');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasSubmittedRecently, setHasSubmittedRecently] = useState(false);
  const { toast } = useToast();

  // Check if user has submitted feedback recently
  useEffect(() => {
    const lastSubmission = localStorage.getItem(STORAGE_KEY);
    if (lastSubmission) {
      const daysSinceSubmission = (Date.now() - parseInt(lastSubmission)) / (1000 * 60 * 60 * 24);
      if (daysSinceSubmission < 30) {
        setHasSubmittedRecently(true);
      }
    }
  }, []);

  const handleFeedbackType = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('rating');
  };

  const handleRating = (value: number) => {
    setRating(value);
    setStep('comment');
  };

  const handleSubmit = async () => {
    // In production, this would send to an API
    console.log('Feedback submitted:', { feedbackType, rating, comment });
    
    // Save submission timestamp
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setHasSubmittedRecently(true);
    
    setStep('thanks');
    
    toast({
      title: "Merci pour votre retour !",
      description: "Votre avis nous aide à améliorer Bikawo.",
    });

    // Close after delay
    setTimeout(() => {
      setIsOpen(false);
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setStep('initial');
    setFeedbackType(null);
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  // Don't show if submitted recently
  if (hasSubmittedRecently) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg gap-2 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Votre avis</span>
        </Button>
      )}

      {/* Feedback card */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 animate-fade-in">
          <Card className="w-80 shadow-xl border-primary/20">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  {step === 'thanks' ? '🎉 Merci !' : 'Votre avis compte'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step: Initial */}
              {step === 'initial' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comment trouvez-vous votre expérience sur Bikawo ?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                      onClick={() => handleFeedbackType('positive')}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Positive
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                      onClick={() => handleFeedbackType('negative')}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      À améliorer
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Rating */}
              {step === 'rating' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {feedbackType === 'positive' 
                      ? 'Super ! Notez votre expérience :' 
                      : 'Désolé ! Notez votre expérience :'}
                  </p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30 hover:text-yellow-400"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Cliquez sur une étoile
                  </p>
                </div>
              )}

              {/* Step: Comment */}
              {step === 'comment' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {feedbackType === 'positive'
                      ? 'Qu\'avez-vous particulièrement apprécié ?'
                      : 'Comment pouvons-nous nous améliorer ?'}
                  </p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Votre commentaire (optionnel)..."
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('rating')}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className="flex-1 gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Thanks */}
              {step === 'thanks' && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <ThumbsUp className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Votre retour nous aide à améliorer notre service !
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
