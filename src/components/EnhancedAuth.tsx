import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchema, type AuthForm } from '@/lib/validations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserCheck, 
  Briefcase, 
  Shield,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

type UserType = 'client' | 'prestataire' | 'admin' | null;
type AuthStep = 'userType' | 'login' | 'signup';

// Interface supprimée - plus de système de blocage

const EnhancedAuth = () => {
  const [step, setStep] = useState<AuthStep>('userType');
  const [userType, setUserType] = useState<UserType>(null);
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

  const signupForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  // Nettoyage du localStorage au démarrage
  useEffect(() => {
    localStorage.removeItem('loginAttempts');
  }, []);

  // Fonction supprimée - plus de système de blocage

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
    setStep('login');
  };

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

      // Récupérer le rôle réel de l'utilisateur depuis la base de données
      const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-role', {
        headers: {
          Authorization: `Bearer ${authData.session?.access_token}`
        }
      });

      if (roleError) {
        console.error('Erreur lors de la récupération du rôle:', roleError);
      }

      const actualRole = roleData?.role || 'user';
      const isProvider = roleData?.isProvider || false;

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Redirection selon le rôle RÉEL en base de données
      if (actualRole === 'admin') {
        navigate('/modern-admin');
      } else if (isProvider) {
        navigate('/espace-prestataire');
      } else {
        navigate('/espace-personnel');
      }
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

  const handleSignUp = async (data: AuthForm) => {
    setLoading(true);

    try {
      // Vérifier d'abord si l'email existe déjà
      try {
        const { data: existsResp, error: existsErr } = await supabase.functions.invoke('check-email-exists', {
          body: { email: data.email }
        });
        if (existsErr) {
          console.warn('check-email-exists error:', existsErr);
        }
        if ((existsResp as any)?.exists) {
          throw new Error('Cet email est déjà utilisé');
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Cet email est déjà utilisé') {
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
            user_type: userType,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('Cet email est déjà utilisé');
        }
        throw error;
      }

      if (authData.user && Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0) {
        throw new Error('Cet email est déjà utilisé');
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

      // Si inscription prestataire, créer automatiquement l'entrée provider
      if (userType === 'prestataire' && authData.user) {
        try {
          const { error: providerError } = await supabase
            .from('providers')
            .insert({
              user_id: authData.user.id,
              business_name: data.name || 'Non renseigné',
              status: 'pending',
              is_verified: false,
              rating: 5.0,
              description: 'Nouveau prestataire en attente de validation'
            });

          if (providerError) {
            console.error('Erreur création provider:', providerError);
          }
        } catch (providerError) {
          console.error('Erreur lors de la création du provider:', providerError);
        }
      }

      toast({
        title: "Inscription réussie ! 🎉",
        description: "Un email de confirmation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.",
      });
    } catch (error: any) {
      if (error.message.includes('Cet email est déjà utilisé')) {
        toast({
          title: "❌ Email déjà utilisé",
          description: "Un compte existe déjà avec cette adresse email.",
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

  const renderUserTypeSelection = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Choisissez votre profil
        </CardTitle>
        <CardDescription className="text-center">
          Sélectionnez le type de compte qui vous correspond
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => handleUserTypeSelection('client')}
          variant="outline"
          className="w-full h-16 flex items-center justify-center space-x-3 hover:bg-primary/5"
        >
          <UserCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">Je suis un Client</span>
        </Button>
        
        <Button
          onClick={() => handleUserTypeSelection('prestataire')}
          variant="outline"
          className="w-full h-16 flex items-center justify-center space-x-3 hover:bg-primary/5"
        >
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">Je suis un Prestataire</span>
        </Button>
        
          <div className="pt-4 border-t">
            <Button
              onClick={() => handleUserTypeSelection('admin')}
              variant="ghost"
              className="w-full h-10 flex items-center justify-center space-x-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Lock className="h-4 w-4" />
              <span>Administration</span>
            </Button>
          </div>
      </CardContent>
    </Card>
  );

  const renderAuthForm = () => {
    const currentForm = step === 'login' ? loginForm : signupForm;
    const currentEmail = currentForm.watch('email');
    const currentPassword = currentForm.watch('password');

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => setStep('userType')}
            className="w-fit p-2 h-auto"
          >
            ← Retour
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            {userType === 'client' ? 'Espace Client' : userType === 'prestataire' ? 'Espace Prestataire' : 'Administration'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
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
                    {userType !== 'admin' && (
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-primary p-0 h-auto"
                        onClick={() => setStep('signup')}
                      >
                        Créer un compte {userType === 'client' ? 'Client' : 'Prestataire'}
                      </Button>
                    )}
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
                        <Input placeholder="Votre nom complet" {...field} />
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
                  {loading ? "Inscription..." : `S'inscrire comme ${userType === 'client' ? 'Client' : 'Prestataire'}`}
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
    );
  };

  return (
    <>
      {step === 'userType' ? renderUserTypeSelection() : renderAuthForm()}
    </>
  );
};

export default EnhancedAuth;