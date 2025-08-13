import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const Admin = () => {
  const { isAdmin, loading } = useAdminRole();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Accès restreint</h1>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les droits d'administrateur pour accéder à cette page.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              Retour à l'accueil
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard />
    </div>
  );
};

export default Admin;