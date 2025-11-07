import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook de déconnexion sécurisé
 * Détruit complètement la session et redirige vers l'accueil
 */
export const useSecureLogout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('[SecureLogout] Logging out user:', user?.email);
      
      // Appeler la méthode signOut qui nettoie tout
      await signOut();
      
      // Nettoyer le localStorage de toute donnée résiduelle
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('bikawo') ||
        key.includes('auth')
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Nettoyer sessionStorage aussi
      sessionStorage.clear();
      
      console.log('[SecureLogout] Session cleared successfully');
      
      toast.success('Déconnexion réussie', {
        description: 'À bientôt sur Bikawo !'
      });
      
      // Rediriger vers l'accueil
      navigate('/', { replace: true });
      
      // Force reload pour être sûr que tout est nettoyé
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('[SecureLogout] Error during logout:', error);
      toast.error('Erreur de déconnexion', {
        description: 'Une erreur est survenue'
      });
    }
  };

  return { handleLogout };
};
