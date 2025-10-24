import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchema, providerSignupSchema, type AuthForm, type ProviderSignupForm } from '@/lib/validations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  AlertTriangle,
  CheckCircle,
  X,
  Phone
} from 'lucide-react';

type AuthStep = 'login' | 'signup';

// Interface supprimée - plus de système de blocage


const ProviderAuth = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Système de blocage retiré
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<ProviderSignupForm>({
    resolver: zodResolver(providerSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
    },
  });

  // Nettoyage du localStorage au démarrage
  useEffect(() => {
    localStorage.removeItem('providerLoginAttempts');
  }, []);

  // Fonction supprimée - plus de système de blocage

  const handleLogin = async (data: AuthForm) => {
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw error;
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la connexion');
      }

      // Vérifier si l'utilisateur est un prestataire vérifié
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id, is_verified')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (providerError) {
        console.error('Error checking provider status:', providerError);
      }

      // Si ce n'est pas un prestataire vérifié, afficher un message d'erreur
      if (!providerData || !providerData.is_verified) {
        // Se déconnecter immédiatement
        await supabase.auth.signOut();
        
        throw new Error('Ce compte n\'est pas un compte prestataire vérifié. Veuillez utiliser la page de connexion client ou soumettre votre candidature pour devenir prestataire.');
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace prestataire",
      });

      navigate('/espace-prestataire');
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: ProviderSignupForm) => {
    setLoading(true);

    try {
      // Vérifier d'abord si l'email ou le téléphone existe déjà
      try {
        const { data: existsResp, error: existsErr } = await supabase.functions.invoke('check-email-exists', {
          body: { email: data.email, phone: data.phone }
        });
        if (existsErr) {
          console.warn('check-email-exists error:', existsErr);
        }
        if ((existsResp as any)?.exists) {
          if ((existsResp as any)?.field === 'email') {
            throw new Error('Cette adresse email est déjà utilisée');
          } else if ((existsResp as any)?.field === 'phone') {
            throw new Error('Ce numéro de téléphone est déjà utilisé');
          } else {
            throw new Error('Cet identifiant est déjà utilisé');
          }
        }
      } catch (err) {
        if (err instanceof Error && (err.message.includes('déjà utilisé') || err.message.includes('déjà utilisée'))) {
          throw err;
        }
        console.warn('check-email-exists invocation failed:', err);
      }

      const redirectUrl = `${window.location.origin}/auth/complete`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone: data.phone,
            user_type: 'prestataire',
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('Cette adresse email est déjà utilisée');
        }
        throw error;
      }

      if (authData.user && Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0) {
        throw new Error('Cette adresse email est déjà utilisée');
      }

      // Déclencher l'envoi de l'email de confirmation personnalisé
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: { 
              userEmail: data.email,
              userId: authData.user.id,
              confirmationToken: authData.session?.access_token
            }
          });

          if (emailError) {
            console.error('Erreur envoi email:', emailError);
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
      }

      toast({
        title: "Inscription réussie ! 🎉",
        description: "Un email de confirmation a été envoyé. Veuillez cliquer sur le lien pour activer votre compte prestataire.",
      });
    } catch (error: any) {
      if (error.message.includes('déjà utilisé') || error.message.includes('déjà utilisée')) {
        toast({
          title: "❌ Identifiant déjà utilisé",
          description: error.message,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setStep('login')}
            >
              💡 Se connecter
            </Button>
          ),
        });
      } else {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const renderPasswordStrength = (password: string) => {
    if (!password) return null;
    
    const { strength, checks } = getPasswordStrength(password);
    const percentage = (strength / 5) * 100;
    
    const getColor = () => {
      if (percentage < 40) return 'bg-red-500';
      if (percentage < 80) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    const getLabel = () => {
      if (percentage < 40) return 'Faible';
      if (percentage < 80) return 'Moyen';
      return 'Fort';
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Progress value={percentage} className="h-1" />
            <div className={`h-1 ${getColor()} rounded-full transition-all duration-300`} 
                 style={{ width: `${percentage}%` }} />
          </div>
          <span className="text-xs font-medium">{getLabel()}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center gap-1 ${checks.length ? 'text-green-600' : 'text-red-500'}`}>
            {checks.length ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
            8+ caractères
          </div>
          <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-green-600' : 'text-red-500'}`}>
            {checks.uppercase ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
            Majuscule
          </div>
          <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-green-600' : 'text-red-500'}`}>
            {checks.lowercase ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
            Minuscule
          </div>
          <div className={`flex items-center gap-1 ${checks.number ? 'text-green-600' : 'text-red-500'}`}>
            {checks.number ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
            Chiffre
          </div>
          <div className={`flex items-center gap-1 ${checks.special ? 'text-green-600' : 'text-red-500'}`}>
            {checks.special ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
            Spécial (!@#...)
          </div>
        </div>
      </div>
    );
  };

  const currentForm = step === 'login' ? loginForm : signupForm;
  const currentEmail = currentForm.watch('email');
  const currentPassword = currentForm.watch('password');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Espace Prestataire
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'login' ? 'Connectez-vous à votre espace' : 'Créez votre compte prestataire'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avertissement de blocage supprimé */}

          {step === 'login' ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Mot de passe
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Votre mot de passe"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>

                <div className="text-center space-y-2">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => navigate('/reset-password')}
                  >
                    Mot de passe oublié ?
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-primary p-0 h-auto"
                      onClick={() => setStep('signup')}
                    >
                      Créer un compte Prestataire
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom complet
                      </FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="name" inputMode="text" placeholder="Votre nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="votre@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="Votre numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Mot de passe
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Choisissez un mot de passe sécurisé"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      {currentPassword && renderPasswordStrength(currentPassword)}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Inscription..." : "Créer mon compte Prestataire"}
                </Button>

                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => setStep('login')}
                  >
                    Déjà un compte ? Se connecter
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderAuth;