import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Importation des images de storytelling
import storytellingIntro from "@/assets/storytelling-intro.jpg";
import storytellingProblem from "@/assets/storytelling-problem.jpg";
import storytellingSolution from "@/assets/storytelling-solution.jpg";
import storytellingSuccess from "@/assets/storytelling-success.jpg";

interface VideoScene {
  id: number;
  title: string;
  image: string;
  text: string;
  voiceText: string;
  duration: number;
}

const StorytellingVideo = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const scenes: VideoScene[] = [
    {
      id: 1,
      title: "Notre histoire commence...",
      image: storytellingIntro,
      text: "Je suis maman, et comme beaucoup… j'ai connu la galère.",
      voiceText: "Je suis maman, et comme beaucoup, j'ai connu la galère. En 2022, à la fin de mes études, j'ai accouché de ma fille.",
      duration: 6000
    },
    {
      id: 2,
      title: "Le défi quotidien",
      image: storytellingProblem,
      text: "Pas de place en crèche, pas de solution simple, et pourtant il fallait s'organiser.",
      voiceText: "Pas de place en crèche, pas de solution simple, et pourtant il fallait s'organiser. Le papa faisait de son mieux, mais avec son travail, nous étions souvent débordés. Malgré tout, j'ai décroché un emploi, avec beaucoup de sacrifices, de larmes, et une charge mentale immense.",
      duration: 8000
    },
    {
      id: 3,
      title: "Le déclic",
      image: storytellingSolution,
      text: "C'est là qu'un déclic est né. Un problème commun se dessinait : la charge mentale.",
      voiceText: "Un an plus tard, tout a basculé, je suis tombée en dépression. J'étais seule, sans aide, sans nounou, sans relais. Et puis j'ai été licenciée. Pendant 9 mois au chômage, j'ai enfin soufflé et j'ai repensé à tout ce que j'avais traversé. C'est là qu'un déclic est né. Un problème commun se dessinait clairement : la charge mentale.",
      duration: 12000
    },
    {
      id: 4,
      title: "L'espoir renaît",
      image: storytellingSuccess,
      text: "Alors avec mon compagnon, nous avons créé Bikawô. Et si aujourd'hui, c'était votre tour de souffler ?",
      voiceText: "Alors avec mon compagnon, nous avons décidé de créer Bikawô. Un service pensé pour accompagner toutes les vies du quotidien, sans jugement, avec douceur, souplesse et humanité. Bikawô, c'est plus qu'un service. C'est une respiration. Un coup de main. Un je suis là pour toi. Et si aujourd'hui, c'était votre tour de souffler ?",
      duration: 10000
    }
  ];

  const generateSpeech = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const playScene = async (sceneIndex: number) => {
    // Arrêter la synthèse vocale précédente
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    setCurrentScene(sceneIndex);
    setIsPlaying(true);

    if (!isMuted) {
      await generateSpeech(scenes[sceneIndex].voiceText);
    }

    // Passer à la scène suivante après la durée définie
    setTimeout(() => {
      if (sceneIndex < scenes.length - 1) {
        playScene(sceneIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }, scenes[sceneIndex].duration);
  };

  const stopVideo = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  const resetVideo = () => {
    stopVideo();
    setCurrentScene(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentAudio) {
      currentAudio.muted = !isMuted;
    }
  };

  const startVideo = () => {
    playScene(0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Video Player */}
      <Card className="overflow-hidden bg-gradient-subtle">
        <div className="relative aspect-video bg-black">
          <img 
            src={scenes[currentScene].image}
            alt={scenes[currentScene].title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay avec texte */}
          <div className="absolute inset-0 bg-black/40 flex items-end">
            <div className="w-full p-8 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 animate-fade-in-up">
                {scenes[currentScene].title}
              </h3>
              <p className="text-lg md:text-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {scenes[currentScene].text}
              </p>
            </div>
          </div>
          
          {/* Contrôles de lecture */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleMute}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-gradient-primary transition-all duration-1000"
            style={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          />
        </div>
        
        {/* Controls */}
        <div className="p-6 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {!isPlaying ? (
                <Button onClick={() => playScene(currentScene)}>
                  <Play className="w-4 h-4 mr-2" />
                  Jouer
                </Button>
              ) : (
                <Button onClick={stopVideo} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button onClick={resetVideo} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Recommencer
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Scène {currentScene + 1} sur {scenes.length}
            </div>
          </div>
          
          {/* Scene Navigation */}
          <div className="flex gap-2 mt-4">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => playScene(index)}
                className={`flex-1 p-2 rounded text-xs transition-colors ${
                  index === currentScene 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {scene.title}
              </button>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Call to Action */}
      <Card className="mt-6 p-6 text-center bg-gradient-hero">
        <h4 className="text-xl font-bold text-white mb-2">
          Prêt à retrouver votre sérénité ?
        </h4>
        <p className="text-white/90 mb-4">
          Découvrez comment Bikawô peut transformer votre quotidien
        </p>
        <Button variant="secondary" size="lg">
          Commencer maintenant
        </Button>
      </Card>
    </div>
  );
};

export default StorytellingVideo;