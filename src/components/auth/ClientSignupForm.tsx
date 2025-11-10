import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

// Schéma de validation simplifié pour l'inscription client
const clientSignupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Seuls les lettres, espaces, tirets et apostrophes sont autorisés"),
  lastName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Seuls les lettres, espaces, tirets et apostrophes sont autorisés"),
  email: z
    .string()
    .min(1, "L'adresse email est obligatoire")
    .email("Format d'email invalide")
    .max(255, "L'email est trop long")
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: "Vous devez accepter les conditions d'utilisation"
    }),
});

type ClientSignupFormData = z.infer<typeof clientSignupSchema>;

export const ClientSignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ClientSignupFormData>({
    resolver: zodResolver(clientSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: ClientSignupFormData) => {
    setIsSubmitting(true);

    try {
      // Normaliser l'email
      const normalizedEmail = data.email.trim().toLowerCase();

      const redirectUrl = `${window.location.origin}/auth/complete`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'client',
            phone: data.phone || null,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        console.error('Signup error:', error);
        
        if (error.message.includes('already') || error.message.includes('exists') || error.message.includes('User already registered')) {
          throw new Error('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse.');
        }
        if (error.message.includes('password')) {
          throw new Error('Le mot de passe ne respecte pas les critères de sécurité requis.');
        }
        if (error.message.includes('email')) {
          throw new Error('Format d\'email invalide. Veuillez vérifier votre adresse.');
        }
        throw new Error('Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
      }

      // Vérifier si l'utilisateur existe déjà (identities vide)
      if (authData.user && Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0) {
        throw new Error('Cet email est déjà utilisé. Veuillez vous connecter.');
      }

      // Envoyer l'email de confirmation personnalisé
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          await supabase.functions.invoke('send-confirmation-email', {
            body: { 
              userEmail: normalizedEmail,
              userId: authData.user.id,
              confirmationToken: authData.session?.access_token
            }
          });
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
      }

      toast({
        title: "Inscription réussie ! 🎉",
        description: "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
      });

      form.reset();
      navigate('/auth/complete');

    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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
                      disabled={isSubmitting}
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
          control={form.control}
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
                    disabled={isSubmitting}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mot de passe */}
        <FormField
          control={form.control}
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
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
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
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone (optionnel)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  autoComplete="tel"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acceptation des conditions */}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  J'accepte les conditions d'utilisation et la politique de confidentialité *
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

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

        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Création de votre compte...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5 mr-2" />
              Créer mon compte client
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
