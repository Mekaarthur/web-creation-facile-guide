import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { useSecureLogout } from '@/hooks/useSecureLogout';

interface SecureLogoutProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

/**
 * Composant de déconnexion sécurisé
 * Détruit complètement la session et redirige vers l'accueil
 */
export const SecureLogout = ({ 
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true 
}: SecureLogoutProps) => {
  const { handleLogout } = useSecureLogout();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Déconnexion
    </Button>
  );
};