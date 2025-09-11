import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, UserCheck, Briefcase } from 'lucide-react';

type UserType = 'client' | 'prestataire' | 'admin' | null;
type AuthStep = 'userType' | 'login' | 'signup';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('userType');
  const [userType, setUserType] = useState<UserType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type);
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Redirection selon le type d'utilisateur sélectionné
      if (userType === 'prestataire') {
        navigate('/espace-prestataire');
      } else if (userType === 'admin') {
        navigate('/modern-admin');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier d'abord si l'email existe déjà
      try {
        const { data: existsResp, error: existsErr } = await supabase.functions.invoke('check-email-exists', {
          body: { email }
        });
        if (existsErr) {
          console.warn('check-email-exists error:', existsErr);
        }
        if ((existsResp as any)?.exists) {
          throw new Error('Cet email est déjà utilisé. Vous avez déjà un compte.');
        }
      } catch (err) {
        console.warn('check-email-exists invocation failed:', err);
      }

      const redirectUrl = `${window.location.origin}/auth/complete`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            user_type: userType,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('Cet email est déjà utilisé. Vous avez déjà un compte.');
        }
        throw error;
      }

      if (data.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
        throw new Error('Cet email est déjà utilisé. Vous avez déjà un compte.');
      }

      // Déclencher l'envoi de l'email de confirmation personnalisé
      if (data.user && !data.user.email_confirmed_at) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: { 
              userEmail: email,
              userId: data.user.id,
              confirmationToken: data.session?.access_token
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
        description: "Un email de confirmation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.",
      });
    } catch (error: any) {
      if (error.message.includes('Cet email est déjà utilisé')) {
        toast({
          title: "❌ Cet email est déjà utilisé",
          description: "Vous avez déjà un compte. Essayez de vous connecter.",
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

  const renderAuthForm = () => (
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
        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
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
            </div>

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
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      {step === 'userType' ? renderUserTypeSelection() : renderAuthForm()}
    </div>
  );
};

export default Auth;