import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Composant qui redirige automatiquement vers l'espace approprié
 * selon le rôle de l'utilisateur connecté
 * Utilisé sur la page d'accueil et après connexion
 */
const AutoRoleRedirect = () => {
  const { user, loading, primaryRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && primaryRole) {
      const redirectMap: Record<UserRole, string> = {
        admin: '/modern-admin',
        provider: '/espace-prestataire',
        client: '/espace-personnel',
        moderator: '/modern-admin',
        user: '/espace-personnel',
      };

      const targetUrl = redirectMap[primaryRole] || '/';
      console.log(`[AutoRoleRedirect] Redirecting ${primaryRole} to ${targetUrl}`);
      navigate(targetUrl, { replace: true });
    }
  }, [user, loading, primaryRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement de votre espace...</p>
      </div>
    </div>
  );
};

export default AutoRoleRedirect;