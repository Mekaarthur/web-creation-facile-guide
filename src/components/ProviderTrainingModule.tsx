import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  BookOpen,
  Award,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ProviderTrainingModuleProps {
  provider: any;
  onComplete: () => void;
}

const TRAINING_QUESTIONS: TrainingQuestion[] = [
  {
    id: 1,
    question: "Quelle est la commission prélevée par Bikawo sur chaque prestation ?",
    options: [
      "20% du montant total",
      "30% du montant total",
      "Le prestataire reçoit 70% du montant client",
      "50% du montant total"
    ],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Dans quel délai devez-vous confirmer votre disponibilité pour une nouvelle mission ?",
    options: [
      "Dans les 24 heures",
      "Dans les 2 heures",
      "Dans les 48 heures",
      "Dans l'heure"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Que devez-vous faire au début de chaque prestation ?",
    options: [
      "Envoyer un SMS au client",
      "Prendre une photo du lieu",
      "Effectuer un check-in avec géolocalisation et photo",
      "Appeler le support Bikawo"
    ],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "Dans quel délai recevez-vous votre fiche de rémunération après une prestation terminée ?",
    options: [
      "Immédiatement",
      "Dans les 24 heures",
      "Sous 4 jours",
      "Sous 7 jours"
    ],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "Que se passe-t-il si un client annule moins de 2h avant la prestation ?",
    options: [
      "Vous ne recevez rien",
      "Vous recevez 30% du montant en compensation",
      "Vous recevez 50% du montant",
      "Vous recevez 100% du montant"
    ],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "Qui gère la facturation de vos prestations ?",
    options: [
      "Le prestataire émet lui-même ses factures",
      "Bikawo émet les factures en votre nom via le mandat",
      "Le client gère la facturation",
      "Aucune facture n'est émise"
    ],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "Que devez-vous faire en cas d'imprévu empêchant d'honorer une mission ?",
    options: [
      "Ne rien faire, Bikawo s'en occupe",
      "Contacter immédiatement le support pour trouver un remplaçant",
      "Annuler la mission vous-même",
      "Demander au client de trouver quelqu'un d'autre"
    ],
    correctAnswer: 1
  },
  {
    id: 8,
    question: "Quels documents sont obligatoires pour être validé comme prestataire ?",
    options: [
      "Seulement la pièce d'identité",
      "Pièce d'identité, casier judiciaire et SIRET",
      "Pièce d'identité et CV",
      "Aucun document n'est obligatoire"
    ],
    correctAnswer: 1
  }
];

export const ProviderTrainingModule = ({ provider, onComplete }: ProviderTrainingModuleProps) => {
  const { toast } = useToast();
  const [videoWatched, setVideoWatched] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleVideoComplete = () => {
    setVideoWatched(true);
    toast({
      title: "Vidéo terminée",
      description: "Vous pouvez maintenant passer au quiz de validation",
    });
  };

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmitQuiz = () => {
    const correctAnswers = TRAINING_QUESTIONS.filter(
      q => answers[q.id] === q.correctAnswer
    ).length;
    
    const finalScore = Math.round((correctAnswers / TRAINING_QUESTIONS.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);

    if (finalScore >= 80) {
      toast({
        title: "Félicitations ! 🎉",
        description: `Vous avez obtenu ${finalScore}% au quiz. Vous êtes maintenant prêt à commencer vos missions.`,
      });
    } else {
      toast({
        title: "Score insuffisant",
        description: `Vous avez obtenu ${finalScore}%. Un minimum de 80% est requis. Veuillez recommencer le quiz.`,
        variant: "destructive"
      });
    }
  };

  const handleComplete = async () => {
    if (score < 80) {
      toast({
        title: "Score insuffisant",
        description: "Vous devez obtenir au moins 80% pour valider la formation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await onComplete();
      
      toast({
        title: "Formation validée !",
        description: "Vous pouvez maintenant passer à l'étape suivante",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de valider la formation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setQuizCompleted(false);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Formation obligatoire Bikawo
              </h2>
              <p className="text-muted-foreground">
                Cette formation de 30 minutes vous explique le fonctionnement de la plateforme, 
                vos obligations et comment maximiser vos revenus.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  30 minutes
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Quiz de validation (80% requis)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vidéo de formation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Vidéo de formation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Placeholder pour vidéo - À remplacer par un vrai lecteur vidéo */}
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center text-white space-y-4">
              <PlayCircle className="w-16 h-16 mx-auto" />
              <div>
                <p className="font-medium">Vidéo de formation Bikawo</p>
                <p className="text-sm text-gray-300">Durée : 30 minutes</p>
              </div>
              {!videoWatched && (
                <Button 
                  onClick={handleVideoComplete}
                  variant="secondary"
                  size="lg"
                >
                  Simuler la fin de la vidéo (Démo)
                </Button>
              )}
            </div>
          </div>

          {videoWatched && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Vidéo terminée ! Vous pouvez maintenant passer au quiz de validation.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => setShowQuiz(true)}
            disabled={!videoWatched}
            className="w-full"
            size="lg"
          >
            Passer au quiz de validation
          </Button>
        </CardContent>
      </Card>

      {/* Quiz de validation */}
      {showQuiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Quiz de validation
            </CardTitle>
            {!quizCompleted && (
              <p className="text-sm text-muted-foreground">
                Répondez aux {TRAINING_QUESTIONS.length} questions. Un score minimum de 80% est requis.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!quizCompleted ? (
              <>
                {TRAINING_QUESTIONS.map((question) => (
                  <div key={question.id} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">
                      {question.id}. {question.question}
                    </p>
                    <RadioGroup
                      value={answers[question.id]?.toString()}
                      onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                    >
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={index.toString()} id={`q${question.id}-${index}`} />
                          <Label htmlFor={`q${question.id}-${index}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                <Button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length !== TRAINING_QUESTIONS.length}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider mes réponses
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Résultats */}
                <div className={`p-6 rounded-lg text-center ${
                  score >= 80 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    score >= 80 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {score >= 80 ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <XCircle className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${
                    score >= 80 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {score >= 80 ? 'Félicitations !' : 'Score insuffisant'}
                  </h3>
                  <p className={`text-lg mb-4 ${
                    score >= 80 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Votre score : {score}%
                  </p>
                  <p className={`text-sm ${
                    score >= 80 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {score >= 80 
                      ? `Vous avez réussi le quiz avec ${
                          TRAINING_QUESTIONS.filter(q => answers[q.id] === q.correctAnswer).length
                        }/${TRAINING_QUESTIONS.length} bonnes réponses.`
                      : `Vous devez obtenir au moins 80% pour valider. Réessayez !`
                    }
                  </p>
                </div>

                {/* Détail des réponses */}
                <div className="space-y-3">
                  {TRAINING_QUESTIONS.map((question) => {
                    const userAnswer = answers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={question.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCorrect ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-2">{question.question}</p>
                            <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              Votre réponse : {question.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-700 mt-1">
                                Bonne réponse : {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {score < 80 && (
                    <Button
                      onClick={resetQuiz}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      Recommencer le quiz
                    </Button>
                  )}
                  {score >= 80 && (
                    <Button
                      onClick={handleComplete}
                      disabled={loading}
                      className="flex-1"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Validation...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Valider la formation
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
