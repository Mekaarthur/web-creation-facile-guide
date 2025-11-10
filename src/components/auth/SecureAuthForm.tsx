import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSecureForm } from '@/hooks/useSecureForm';
import { signupSchema, emailSchema, passwordSchema, nameSchema, type SignupData } from '@/lib/security-validation';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Schéma de login (sans validation du nom)
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'), // Pas de validation stricte pour login
});

type LoginData = z.infer<typeof loginSchema>;
type UserType = 'client' | 'prestataire' | 'admin';

interface SecureAuthFormProps {
  mode: 'login' | 'signup';
  userType: UserType | null;
  onSuccess?: () => void;
}

export const SecureAuthForm = ({ mode, userType, onSuccess }: SecureAuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ========== SIGNUP FORM ==========
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      acceptTerms: false,
    },
  });

  const { handleSubmit: handleSignupSubmit, isSubmitting: isSignupSubmitting, errors: signupErrors } = useSecureForm({
    schema: signupSchema,
    onSubmit: async (validatedData) => {
      // Vérifier si l'email existe déjà
      try {
        const { data: existsResp, error: existsErr } = await supabase.functions.invoke('check-email-exists', {
          body: { email: validatedData.email }
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
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: `${validatedData.firstName} ${validatedData.lastName}`,
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            user_type: userType,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse.');
        }
        if (error.message.includes('password')) {
          throw new Error('Le mot de passe ne respecte pas les critères de sécurité requis.');
        }
        if (error.message.includes('email')) {
          throw new Error('Format d\'email invalide. Veuillez vérifier votre adresse.');
        }
        throw new Error(error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
      }

      if (authData.user && Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Déclencher l'envoi de l'email de confirmation personnalisé
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: { 
              userEmail: validatedData.email,
              userId: authData.user.id,
              confirmationToken: authData.session?.access_token
            }
          });
          if (emailError) {
            console.error('Erreur email confirmation:', emailError);
            toast({
              title: "Inscription réussie mais...",
              description: "L'email de confirmation n'a pas pu être envoyé. Contactez le support.",
              variant: "destructive"
            });
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
          toast({
            title: "Inscription réussie mais...",
            description: "L'email de confirmation n'a pas pu être envoyé. Contactez le support.",
            variant: "destructive"
          });
        }
      }

      // Si inscription prestataire, créer automatiquement l'entrée provider
      if (userType === 'prestataire' && authData.user) {
        try {
          await supabase.functions.invoke('create-provider-profile', {
            body: { userId: authData.user.id }
          });
        } catch (providerError) {
          console.error('Erreur création profil prestataire:', providerError);
        }
      }

      toast({
        title: "Inscription réussie ! 🎉",
        description: "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
      });

      // Reset form
      signupForm.reset();
      
      // Redirection vers la page de confirmation
      navigate('/auth/complete');
      
      if (onSuccess) {
        onSuccess();
      }
    },
    rateLimitKey: signupForm.watch('email') || 'anonymous',
    rateLimitAction: 'signup'
  });

  // ========== LOGIN FORM ==========
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { handleSubmit: handleLoginSubmit, isSubmitting: isLoginSubmitting, errors: loginErrors } = useSecureForm({
    schema: loginSchema,
    onSubmit: async (validatedData) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.');
        }
        if (error.message.includes('Email not confirmed')) {
          setUnconfirmedEmail(validatedData.email);
          throw new Error('Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail (y compris les spams) ou cliquez sur "Renvoyer l\'email de confirmation".');
        }
        if (error.message.includes('User not found')) {
          throw new Error('Aucun compte trouvé avec cet email. Veuillez créer un compte.');
        }
        throw new Error(error.message || 'Erreur de connexion. Veuillez réessayer.');
      }

      // Vérifier si l'email est confirmé
      if (!authData.user?.email_confirmed_at) {
        setUnconfirmedEmail(validatedData.email);
        throw new Error('Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail (y compris les spams) ou cliquez sur "Renvoyer l\'email de confirmation" ci-dessous.');
      }

      // Déterminer le rôle et le statut prestataire en lecture directe (RLS)
      let actualRole: 'admin' | 'user' = 'user';
      let isProvider = false;

      try {
        const { data: adminRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user?.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (adminRow?.role === 'admin') actualRole = 'admin';
      } catch (e) {
        console.warn('admin role check error:', e);
      }

      try {
        const { data: providerRow } = await supabase
          .from('providers')
          .select('is_verified')
          .eq('user_id', authData.user?.id)
          .maybeSingle();
        if (providerRow?.is_verified) isProvider = true;
      } catch (e) {
        console.warn('provider check error:', e);
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      // Attendre que le listener onAuthStateChange se déclenche et mette à jour le contexte
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirection priorisant le choix explicite de l'utilisateur
      let destination = '';
      if (userType === 'prestataire') {
        // Toujours respecter le choix prestataire, même si l'utilisateur a aussi un rôle admin
        destination = '/espace-prestataire';
      } else if (userType === 'client') {
        destination = '/espace-personnel';
      } else if (userType === 'admin') {
        destination = '/admin';
      } else if (actualRole === 'admin') {
        destination = '/admin';
      } else if (isProvider) {
        destination = '/espace-prestataire';
      } else {
        destination = '/espace-personnel';
      }
      navigate(destination);

      if (onSuccess) {
        onSuccess();
      }
    },
    rateLimitKey: loginForm.watch('email') || 'anonymous',
    rateLimitAction: 'login'
  });

  // Fonction pour renvoyer l'email de confirmation
  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;

    setIsResendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('resend-confirmation-email', {
        body: { email: unconfirmedEmail }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email renvoyé ! 📧",
        description: "Vérifiez votre boîte mail (et vos spams).",
      });

      setUnconfirmedEmail(null);
    } catch (error: any) {
      console.error('Erreur resend confirmation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de renvoyer l'email",
        variant: "destructive"
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  // ========== RENDER ==========
  if (mode === 'signup') {
    return (
      <Form {...signupForm}>
        <form 
          onSubmit={signupForm.handleSubmit((data) => handleSignupSubmit(data))}
          className="space-y-4"
        >
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={signupForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Jean"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signupForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Dupont"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={signupForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@exemple.com"
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mot de passe */}
          <FormField
            control={signupForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Téléphone (optionnel) */}
          <FormField
            control={signupForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>Téléphone (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+33 6 12 34 56 78 ou 06 12 34 56 78"
                    autoComplete="tel"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Format accepté : +33612345678 ou 0612345678
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Acceptation des conditions */}
          <FormField
            control={signupForm.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1 h-4 w-4"
                    id="acceptTerms"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="acceptTerms" className="cursor-pointer">
                    J'accepte les conditions d'utilisation et la politique de confidentialité *
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Ce champ est obligatoire pour créer votre compte
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Bouton de soumission */}
          {/* Résumé des champs requis */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-semibold mb-1">Champs obligatoires (*) :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Prénom et Nom</li>
              <li>Adresse email valide</li>
              <li>Mot de passe sécurisé (8 caractères minimum)</li>
              <li>Acceptation des conditions d'utilisation</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSignupSubmitting}
          >
            {isSignupSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Création de votre compte...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Créer mon compte
              </>
            )}
          </Button>

          {/* Avertissement sécurité */}
          <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2 mt-4">
            <Shield className="h-4 w-4 text-primary" />
            <span>Connexion sécurisée avec protection anti-spam</span>
          </div>
        </form>
      </Form>
    );
  }

  // ========== LOGIN MODE ==========
  return (
    <Form {...loginForm}>
      <form 
        onSubmit={loginForm.handleSubmit((data) => handleLoginSubmit(data))}
        className="space-y-4"
      >
        {/* Email */}
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...field}
                    type="email"
                    placeholder="email@exemple.com"
                    autoComplete="email"
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mot de passe */}
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoginSubmitting}
        >
          {isLoginSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Connexion en cours...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5 mr-2" />
              Se connecter
            </>
          )}
        </Button>

        {/* Message informatif */}
        <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-md">
          💡 <strong>Important :</strong> Assurez-vous d'avoir confirmé votre email avant de vous connecter. Vérifiez votre boîte de réception et vos spams.
        </div>

        {/* Bouton renvoyer email si non confirmé */}
        {unconfirmedEmail && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendConfirmation}
            disabled={isResendingEmail}
          >
            {isResendingEmail ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Renvoyer l'email de confirmation
              </>
            )}
          </Button>
        )}

        {/* Avertissement sécurité */}
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2 mt-4">
          <Shield className="h-4 w-4 text-primary" />
          <span>Protection anti-brute-force activée (5 tentatives/min)</span>
        </div>
      </form>
    </Form>
  );
};
