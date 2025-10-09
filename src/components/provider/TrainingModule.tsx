import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GraduationCap, PlayCircle, CheckCircle, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TrainingModuleProps {
  providerId: string;
  onCompleted?: () => void;
}

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Quel est le délai pour confirmer une mission après attribution ?",
    options: [
      { value: "30min", label: "30 minutes" },
      { value: "2h", label: "2 heures" },
      { value: "24h", label: "24 heures" },
      { value: "48h", label: "48 heures" }
    ],
    correctAnswer: "2h"
  },
  {
    id: 2,
    question: "Que devez-vous faire en arrivant sur le lieu de la mission ?",
    options: [
      { value: "call", label: "Appeler le client" },
      { value: "checkin", label: "Effectuer le check-in dans l'app" },
      { value: "wait", label: "Attendre les instructions" },
      { value: "nothing", label: "Commencer directement" }
    ],
    correctAnswer: "checkin"
  },
  {
    id: 3,
    question: "Quel pourcentage du prix client vous est reversé ?",
    options: [
      { value: "50", label: "50%" },
      { value: "60", label: "60%" },
      { value: "70", label: "70%" },
      { value: "80", label: "80%" }
    ],
    correctAnswer: "70"
  },
  {
    id: 4,
    question: "Combien de temps avez-vous pour annuler une mission sans pénalité ?",
    options: [
      { value: "2h", label: "2 heures avant" },
      { value: "24h", label: "24 heures avant" },
      { value: "48h", label: "48 heures avant" },
      { value: "72h", label: "72 heures avant" }
    ],
    correctAnswer: "24h"
  },
  {
    id: 5,
    question: "Que devez-vous faire si vous êtes en retard pour une mission ?",
    options: [
      { value: "nothing", label: "Ne rien faire" },
      { value: "cancel", label: "Annuler la mission" },
      { value: "notify", label: "Prévenir immédiatement le client et l'admin" },
      { value: "rush", label: "Y aller le plus vite possible sans prévenir" }
    ],
    correctAnswer: "notify"
  },
  {
    id: 6,
    question: "Quand recevez-vous votre rémunération après une mission ?",
    options: [
      { value: "immediately", label: "Immédiatement" },
      { value: "next_day", label: "Le lendemain" },
      { value: "4_days", label: "4 jours après" },
      { value: "10_days", label: "10 jours ouvrés après" }
    ],
    correctAnswer: "10_days"
  },
  {
    id: 7,
    question: "Que devez-vous faire après avoir terminé une mission ?",
    options: [
      { value: "leave", label: "Partir directement" },
      { value: "checkout", label: "Faire le check-out avec photos" },
      { value: "invoice", label: "Envoyer une facture" },
      { value: "call", label: "Appeler l'admin" }
    ],
    correctAnswer: "checkout"
  },
  {
    id: 8,
    question: "Quelle est la note minimale pour rester actif sur la plateforme ?",
    options: [
      { value: "3", label: "3/5" },
      { value: "3.5", label: "3.5/5" },
      { value: "4", label: "4/5" },
      { value: "4.5", label: "4.5/5" }
    ],
    correctAnswer: "4"
  },
  {
    id: 9,
    question: "Combien de missions devez-vous refuser consécutivement avant suspension ?",
    options: [
      { value: "2", label: "2 missions" },
      { value: "3", label: "3 missions" },
      { value: "5", label: "5 missions" },
      { value: "10", label: "10 missions" }
    ],
    correctAnswer: "3"
  },
  {
    id: 10,
    question: "Êtes-vous autorisé à demander des pourboires au client ?",
    options: [
      { value: "yes", label: "Oui, c'est encouragé" },
      { value: "no", label: "Non, c'est strictement interdit" },
      { value: "sometimes", label: "Seulement si le service est exceptionnel" },
      { value: "cash_only", label: "Oui, mais uniquement en espèces" }
    ],
    correctAnswer: "no"
  }
];

export const TrainingModule = ({ providerId, onCompleted }: TrainingModuleProps) => {
  const [step, setStep] = useState<'intro' | 'video' | 'quiz' | 'completed'>('intro');
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const progress = 
    step === 'intro' ? 0 : 
    step === 'video' ? 33 : 
    step === 'quiz' ? 66 : 
    100;

  const handleVideoComplete = () => {
    setVideoWatched(true);
    toast.success('Vidéo terminée', {
      description: 'Vous pouvez maintenant passer au quiz'
    });
  };

  const handleQuizSubmit = async () => {
    // Calculer le score
    let correctCount = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = (correctCount / QUIZ_QUESTIONS.length) * 100;
    setScore(finalScore);
    setQuizSubmitted(true);

    // Si score >= 80%, valider la formation
    if (finalScore >= 80) {
      try {
        const { error } = await supabase
          .from('providers')
          .update({
            formation_completed: true,
            formation_score: finalScore,
            formation_date: new Date().toISOString()
          })
          .eq('id', providerId);

        if (error) throw error;

        toast.success('Formation réussie !', {
          description: `Vous avez obtenu ${correctCount}/${QUIZ_QUESTIONS.length} (${Math.round(finalScore)}%)`
        });

        setTimeout(() => {
          setStep('completed');
          onCompleted?.();
        }, 2000);
      } catch (error: any) {
        toast.error('Erreur', { description: error.message });
      }
    } else {
      toast.error('Score insuffisant', {
        description: `Il vous faut au moins 80% pour valider (vous avez ${Math.round(finalScore)}%)`
      });
    }
  };

  const canSubmitQuiz = Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length;

  if (step === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Formation complétée
          </CardTitle>
          <CardDescription>
            Félicitations ! Vous avez validé la formation Bikawo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4 py-8">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{Math.round(score)}%</p>
              <p className="text-muted-foreground">Score obtenu</p>
            </div>
            <Badge className="bg-green-600">Formation validée</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Formation obligatoire
        </CardTitle>
        <CardDescription>
          Complétez cette formation pour devenir prestataire Bikawo
        </CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intro */}
        {step === 'intro' && (
          <div className="space-y-4">
            <div className="prose prose-sm">
              <h3>Bienvenue dans la formation Bikawo</h3>
              <p>
                Cette formation vous permettra de comprendre:
              </p>
              <ul>
                <li>Comment fonctionne la plateforme</li>
                <li>Vos obligations en tant que prestataire</li>
                <li>Les processus de check-in et check-out</li>
                <li>La gestion des missions et des paiements</li>
                <li>Les règles de qualité et de professionnalisme</li>
              </ul>
              <p>
                La formation comprend:
              </p>
              <ul>
                <li>📹 Une vidéo de 15 minutes</li>
                <li>📝 Un quiz de validation (10 questions)</li>
                <li>✅ Score minimum requis: 80%</li>
              </ul>
            </div>
            <Button onClick={() => setStep('video')} className="w-full">
              Commencer la formation
            </Button>
          </div>
        )}

        {/* Vidéo */}
        {step === 'video' && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white space-y-3">
                <PlayCircle className="h-16 w-16 mx-auto" />
                <p>Vidéo de formation Bikawo</p>
                <p className="text-sm text-gray-400">Durée: 15 minutes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('intro')}
              >
                Retour
              </Button>
              <Button 
                onClick={handleVideoComplete}
                className="flex-1"
                disabled={!videoWatched}
              >
                {videoWatched ? 'Passer au quiz' : 'Marquer comme vue'}
              </Button>
              {!videoWatched && (
                <Button 
                  onClick={() => setVideoWatched(true)}
                  variant="ghost"
                  size="sm"
                >
                  Simuler fin
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Quiz */}
        {step === 'quiz' && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b">
              <h3 className="text-lg font-semibold">Quiz de validation</h3>
              <p className="text-sm text-muted-foreground">
                {Object.keys(quizAnswers).length} / {QUIZ_QUESTIONS.length} questions répondues
              </p>
            </div>

            {quizSubmitted && score < 80 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Score insuffisant: {Math.round(score)}%. Vous devez obtenir au moins 80% pour valider.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setQuizSubmitted(false);
                    setQuizAnswers({});
                  }}
                  className="mt-2"
                >
                  Recommencer
                </Button>
              </div>
            )}

            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="font-medium">
                    {idx + 1}. {q.question}
                  </div>
                  <RadioGroup
                    value={quizAnswers[q.id] || ''}
                    onValueChange={(value) => {
                      if (!quizSubmitted) {
                        setQuizAnswers({ ...quizAnswers, [q.id]: value });
                      }
                    }}
                    disabled={quizSubmitted}
                  >
                    {q.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`q${q.id}-${option.value}`} />
                        <Label 
                          htmlFor={`q${q.id}-${option.value}`}
                          className={`cursor-pointer ${
                            quizSubmitted && option.value === q.correctAnswer
                              ? 'text-green-600 font-medium'
                              : quizSubmitted && quizAnswers[q.id] === option.value && option.value !== q.correctAnswer
                              ? 'text-red-600'
                              : ''
                          }`}
                        >
                          {option.label}
                          {quizSubmitted && option.value === q.correctAnswer && ' ✓'}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('video')}
                disabled={quizSubmitted}
              >
                Retour
              </Button>
              <Button 
                onClick={handleQuizSubmit}
                disabled={!canSubmitQuiz || quizSubmitted}
                className="flex-1"
              >
                {quizSubmitted ? 'Quiz soumis' : 'Valider le quiz'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
