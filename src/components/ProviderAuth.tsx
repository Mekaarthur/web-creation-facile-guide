import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  CheckCircle,
  X,
  Phone,
  Euro,
  Calendar,
  Shield,
  Clock,
  ArrowLeft
} from 'lucide-react';

type AuthStep = 'login' | 'signup';

const ProviderAuth = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    mode: 'onChange',
  });

  useEffect(() => {
    localStorage.removeItem('providerLoginAttempts');
  }, []);

  useEffect(() => {
    if (step === 'signup') {
      setTimeout(() => {
        signupForm.setFocus('name');
      }, 0);
    }
  }, [step, signupForm]);

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

      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id, is_verified')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (providerError) {
        console.error('Error checking provider status:', providerError);
      }

      if (!providerData || !providerData.is_verified) {
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

  const benefits = [
    { icon: Euro, title: "Revenus attractifs", description: "Tarifs compétitifs et paiements garantis" },
    { icon: Calendar, title: "Flexibilité totale", description: "Gérez votre emploi du temps librement" },
    { icon: Shield, title: "Protection assurée", description: "Assurance RC Pro incluse" },
    { icon: Clock, title: "Support 7j/7", description: "Une équipe dédiée à votre réussite" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour à l'accueil</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/4c766686-0c19-4be4-b410-bc4ee2dc5c59.png" 
              alt="Bikawo" 
              className="h-8 w-auto"
            />
          </Link>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
          {/* Left side - Benefits */}
          <div className="space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Rejoignez la communauté <span className="text-primary">Bikawo</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Devenez prestataire et développez votre activité en toute sérénité.
              </p>
            </div>

            {/* Benefits grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 border-2 border-background flex items-center justify-center text-xs font-medium text-primary-foreground"
                    >
                      {['M', 'S', 'A', 'L'][i-1]}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium">+150 prestataires actifs</p>
                  <p className="text-xs text-muted-foreground">en Île-de-France</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div>
            <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-center">
                  {step === 'login' ? 'Connexion Prestataire' : 'Créer mon compte'}
                </CardTitle>
                <CardDescription className="text-center">
                  {step === 'login' ? 'Accédez à votre espace prestataire' : 'Rejoignez notre équipe de prestataires'}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                            className="text-primary p-0 h-auto font-semibold"
                            onClick={() => setStep('signup')}
                          >
                            Devenir prestataire
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
                              <Input
                                type="text"
                                autoComplete="name"
                                inputMode="text"
                                autoFocus
                                enterKeyHint="next"
                                placeholder="Votre nom complet"
                                maxLength={50}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  signupForm.setValue('name', val, { shouldDirty: true, shouldTouch: true });
                                  field.onChange(val);
                                }}
                                onInput={(e) => field.onChange((e.target as HTMLInputElement).value)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                aria-required="true"
                              />
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
                                  placeholder="Créer un mot de passe sécurisé"
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
                            {renderPasswordStrength(field.value || '')}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading}
                      >
                        {loading ? "Inscription..." : "Créer mon compte prestataire"}
                      </Button>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">
                          Déjà un compte ?{" "}
                          <Button 
                            type="button" 
                            variant="link" 
                            className="text-primary p-0 h-auto font-semibold"
                            onClick={() => setStep('login')}
                          >
                            Se connecter
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">
                        En créant un compte, vous acceptez nos{" "}
                        <Link to="/cgv" className="text-primary hover:underline">CGV</Link>
                        {" "}et notre{" "}
                        <Link to="/politique-confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>
                      </p>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderAuth;
