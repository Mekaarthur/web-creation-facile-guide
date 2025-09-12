import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  FileText, 
  Star, 
  MapPin, 
  Clock,
  Briefcase,
  Settings,
  DollarSign,
  TrendingUp,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import EnhancedProviderDashboard from '@/components/EnhancedProviderDashboard';
import ProviderProfileForm from '@/components/ProviderProfileForm';

const EspacePrestataire = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à l'espace prestataire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnhancedProviderDashboard />
    </div>
  );
};

export default EspacePrestataire;