import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminRoute = ({ children, redirectTo = '/auth' }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification des droits administrateur...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
