import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, 
  Briefcase, 
  Shield,
  X,
  ArrowLeft
} from 'lucide-react';
import { SecureAuthForm } from '@/components/auth/SecureAuthForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-5xl">
        {/* En-tête avec retour */}
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
                <SecureAuthForm
                  mode={step}
                  userType={userType}
                  onSuccess={() => {
                    // Redirection gérée dans SecureAuthForm
                  }}
                />

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
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Connexion sécurisée SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Données protégées RGPD</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            En vous inscrivant, vous acceptez nos{' '}
            <button onClick={() => navigate('/cgu')} className="text-primary hover:underline">
              Conditions d'utilisation
            </button>
            {' '}et notre{' '}
            <button onClick={() => navigate('/privacy')} className="text-primary hover:underline">
              Politique de confidentialité
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuth;
