import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

const PasswordChangeForm = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const passwordRequirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean) && currentPassword.length > 0;

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      // Tenter une re-authentification pour vérifier le mot de passe actuel
      const { error } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: password,
      });
      
      return !error;
    } catch (error) {
      return false;
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez respecter tous les critères de mot de passe",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await validateCurrentPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Le mot de passe actuel est incorrect');
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Réinitialiser le formulaire
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Mot de passe mis à jour ! 🎉",
        description: "Votre mot de passe a été modifié avec succès. Un email de confirmation vous a été envoyé.",
      });

      // Déclencher l'envoi de l'email de confirmation via Edge Function
      try {
        await supabase.functions.invoke('send-password-reset', {
          body: {
            type: 'password_changed',
            userEmail: (await supabase.auth.getUser()).data.user?.email
          }
        });
      } catch (emailError) {
        console.error('Erreur envoi email confirmation:', emailError);
        // Ne pas bloquer le processus si l'email échoue
      }

    } catch (error: any) {
      toast({
        title: "Erreur de modification",
        description: error.message || "Une erreur est survenue lors de la modification du mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-sm">
      {met ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={met ? "text-green-700" : "text-red-700"}>
        {text}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Changer mon mot de passe</span>
        </CardTitle>
        <CardDescription>
          Modifiez votre mot de passe pour sécuriser votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* Mot de passe actuel */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            {/* Critères de sécurité */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Critères de sécurité :</p>
                <RequirementItem met={passwordRequirements.length} text="Au moins 8 caractères" />
                <RequirementItem met={passwordRequirements.uppercase} text="Au moins une majuscule" />
                <RequirementItem met={passwordRequirements.lowercase} text="Au moins une minuscule" />
                <RequirementItem met={passwordRequirements.number} text="Au moins un chiffre" />
              </div>
            )}
          </div>

          {/* Confirmation du mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            {confirmPassword && (
              <RequirementItem met={passwordRequirements.match} text="Les mots de passe correspondent" />
            )}
          </div>

          {/* Informations de sécurité */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex space-x-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">
                  Sécurité de votre compte
                </p>
                <p className="text-sm text-blue-700">
                  • Un email de confirmation sera envoyé après modification
                </p>
                <p className="text-sm text-blue-700">
                  • Vous ne serez pas déconnecté de vos autres appareils
                </p>
                <p className="text-sm text-blue-700">
                  • Assurez-vous d'utiliser un mot de passe unique
                </p>
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            disabled={!isPasswordValid || loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Modification en cours...
              </>
            ) : (
              "Changer le mot de passe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordChangeForm;