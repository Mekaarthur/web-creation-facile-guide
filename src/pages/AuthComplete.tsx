import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader, Mail, ArrowRight } from 'lucide-react';

const AuthComplete = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupérer les paramètres d'URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Une erreur est survenue lors de la confirmation');
          return;
        }

        if (token && type === 'signup') {
          // Vérifier la session utilisateur
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Erreur session:', sessionError);
            setStatus('error');
            setMessage('Erreur lors de la vérification de votre session');
            return;
          }

          if (session?.user) {
            setStatus('success');
            setMessage('Votre email a été confirmé avec succès !');
            
            toast({
              title: "Email confirmé ! 🎉",
              description: "Votre compte est maintenant activé. Bienvenue chez Bikawo !",
            });

            // Rediriger vers l'espace personnel après 3 secondes
            setTimeout(() => {
              navigate('/espace-personnel');
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Session utilisateur non trouvée. Veuillez vous connecter.');
          }
        } else {
          // Pas de token, probablement une visite directe
          const urlMessage = searchParams.get('message');
          if (urlMessage) {
            setStatus('error');
            setMessage(urlMessage);
          } else {
            setStatus('error');
            setMessage('Lien de confirmation invalide ou expiré');
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de la confirmation:', error);
        setStatus('error');
        setMessage('Une erreur inattendue est survenue');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirmation en cours...';
      case 'success':
        return 'Email confirmé !';
      case 'error':
        return 'Erreur de confirmation';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  Vous allez être automatiquement redirigé vers votre espace personnel dans quelques secondes...
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/espace-personnel')}
                className="w-full"
              >
                Accéder à mon espace personnel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-center space-x-2 text-red-700">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm">
                    Problème avec votre confirmation d'email
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                Veuillez patienter pendant que nous vérifions votre email...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthComplete;