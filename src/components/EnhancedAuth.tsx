import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, 
  Briefcase, 
  Shield,
  X,
  ArrowLeft,
  Home,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import { SecureAuthForm } from '@/components/auth/SecureAuthForm';
import { ClientSignupForm } from '@/components/auth/ClientSignupForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
// Logo Bikawo officiel
const bikawoLogo = "/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png";

type UserType = 'client' | 'prestataire' | 'admin' | null;
type AuthStep = 'userType' | 'login' | 'signup';

const EnhancedAuth = () => {
  const [step, setStep] = useState<AuthStep>('userType');
  const [userType, setUserType] = useState<UserType>(null);
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !session) return;

    // Éviter toute auto-redirection pendant un flux explicite (sélection + login/signup)
    if (step === 'userType' || step === 'login' || step === 'signup') return;

    let cancelled = false;
    const run = async () => {
      setRedirecting(true);
      try {
        let actualRole: 'admin' | 'user' = 'user';
        let isProvider = false;
        // Direct checks only (avoid edge function flakiness)
        try {
          const { data: adminRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();
          if (adminRow?.role === 'admin') actualRole = 'admin';
        } catch {}
        try {
          const { data: providerRow } = await supabase
            .from('providers')
            .select('is_verified')
            .eq('user_id', user.id)
            .maybeSingle();
          if (providerRow?.is_verified) isProvider = true;
        } catch {}
        // Redirect according to role
        await new Promise(r => setTimeout(r, 200));
        if (cancelled) return;
        if (actualRole === 'admin') navigate('/admin', { replace: true });
        else if (isProvider) navigate('/espace-prestataire', { replace: true });
        else navigate('/espace-personnel', { replace: true });
      } finally {
        if (!cancelled) setRedirecting(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [authLoading, user, session, step, userType, navigate]);

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
    setStep('login');
  };

  const handleBack = () => {
    if (step === 'login' || step === 'signup') {
      setStep('userType');
      setUserType(null);
    } else {
      navigate('/');
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'client':
        return 'Client';
      case 'prestataire':
        return 'Prestataire';
      case 'admin':
        return 'Administrateur';
      default:
        return '';
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="flex items-center">
              <img 
                src={bikawoLogo} 
                alt="Bikawô Logo" 
                className="h-8 sm:h-10 w-auto bg-transparent"
              />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Accueil</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-6xl grid lg:grid-cols-5 gap-8 items-start">
          
          {/* Left side - Trust indicators (hidden on mobile for step !== userType) */}
          <div className={`lg:col-span-2 space-y-6 ${step !== 'userType' ? 'hidden lg:block' : ''}`}>
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-bold">
                Rejoignez <span className="text-primary">Bikawo</span>
              </h1>
              <p className="text-muted-foreground">
                Plus de 5000 familles nous font confiance en Île-de-France.
              </p>
            </div>

            {/* Trust stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">4.9/5</span>
                </div>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
              <div className="p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-bold">24h</span>
                </div>
                <p className="text-xs text-muted-foreground">Délai moyen</p>
              </div>
            </div>

            {/* Benefits list */}
            <div className="space-y-3">
              {[
                '50% de crédit d\'impôts sur vos services',
                'Prestataires vérifiés et assurés',
                'Paiement 100% sécurisé',
                'Support client 7j/7'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-sm italic mb-2">
                "Service impeccable ! Ma nounou est formidable et mes enfants l'adorent."
              </p>
              <p className="text-xs text-muted-foreground">— Marie L., Paris 16e</p>
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="lg:col-span-3">
          {/* En-tête avec retour - Seulement si pas sur userType */}
          {step !== 'userType' && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}

        <Card className="border-2 shadow-2xl">
          {/* ÉTAPE 1: Sélection du type d'utilisateur */}
          {step === 'userType' && (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Shield className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Bienvenue sur Bikawo</CardTitle>
                <CardDescription className="text-lg">
                  Choisissez votre type de compte pour continuer
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Client */}
                <button
                  onClick={() => handleUserTypeSelection('client')}
                  className="group relative p-8 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                      <UserCheck className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Je suis Client</h3>
                      <p className="text-muted-foreground">
                        Je recherche des services de qualité
                      </p>
                    </div>
                  </div>
                </button>

                {/* Prestataire */}
                <button
                  onClick={() => handleUserTypeSelection('prestataire')}
                  className="group relative p-8 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-300 text-left"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                      <Briefcase className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Je suis Prestataire</h3>
                      <p className="text-muted-foreground">
                        Je propose mes services
                      </p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </>
          )}

          {/* ÉTAPE 2 & 3: Login/Signup avec SecureAuthForm */}
          {(step === 'login' || step === 'signup') && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {step === 'login' ? 'Connexion' : 'Inscription'} - {getUserTypeLabel()}
                    </CardTitle>
                    <CardDescription>
                      {step === 'login'
                        ? 'Connectez-vous à votre espace personnel'
                        : 'Créez votre compte de manière sécurisée'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 🔒 Formulaire Sécurisé */}
                {step === 'signup' && userType === 'client' ? (
                  <ClientSignupForm />
                ) : (
                  <SecureAuthForm
                    mode={step}
                    userType={userType}
                    onSuccess={() => {
                      // Redirection gérée dans SecureAuthForm
                    }}
                  />
                )}

                {/* Bascule Login/Signup */}
                <div className="text-center">
                  {step === 'login' ? (
                    <p className="text-sm text-muted-foreground">
                      Pas encore de compte ?{' '}
                      <button
                        onClick={() => setStep('signup')}
                        className="text-primary hover:underline font-semibold"
                      >
                        S'inscrire
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vous avez déjà un compte ?{' '}
                      <button
                        onClick={() => setStep('login')}
                        className="text-primary hover:underline font-semibold"
                      >
                        Se connecter
                      </button>
                    </p>
                  )}
                </div>

                {/* Lien Mot de passe oublié */}
                {step === 'login' && (
                  <div className="text-center">
                    <button
                      onClick={() => navigate('/reset-password')}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer avec badges de sécurité */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>SSL sécurisé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>RGPD conforme</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            En vous inscrivant, vous acceptez nos{' '}
            <button onClick={() => navigate('/cgu')} className="text-primary hover:underline">
              CGU
            </button>
            {' '}et notre{' '}
            <button onClick={() => navigate('/privacy')} className="text-primary hover:underline">
              Politique de confidentialité
            </button>
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuth;
