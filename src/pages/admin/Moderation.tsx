import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModerationItem {
  id: string;
  type: 'review' | 'provider' | 'booking';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  reporter?: string;
}

export default function AdminModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { toast } = useToast();

  const loadModerationItems = async () => {
    try {
      // Charger les avis non approuvés
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', false);

      if (reviewsError) throw reviewsError;

      // Simuler d'autres éléments de modération
      const mockItems: ModerationItem[] = [
        {
          id: '1',
          type: 'provider',
          title: 'Prestataire suspect',
          description: 'Profil incomplet avec informations contradictoires',
          status: 'pending',
          priority: 'high',
          created_at: new Date().toISOString(),
          reporter: 'Système automatique'
        },
        {
          id: '2',
          type: 'booking',
          title: 'Mission annulée de façon suspecte',
          description: 'Annulation répétée par le même client',
          status: 'pending',
          priority: 'medium',
          created_at: new Date().toISOString(),
          reporter: 'Prestataire Jean Dupont'
        },
      ];

      const reviewItems: ModerationItem[] = (reviews || []).map(review => ({
        id: review.id,
        type: 'review' as const,
        title: `Avis en attente de validation`,
        description: review.comment || 'Pas de commentaire',
        status: 'pending' as const,
        priority: 'low' as const,
        created_at: review.created_at,
      }));

      setItems([...mockItems, ...reviewItems]);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les éléments de modération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationItems();
  }, []);

  const filteredItems = items.filter(item => 
    statusFilter === 'all' || item.status === statusFilter
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'review':
        return <Badge variant="secondary">Avis</Badge>;
      case 'provider':
        return <Badge variant="outline">Prestataire</Badge>;
      case 'booking':
        return <Badge variant="default">Mission</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Haute</Badge>;
      case 'medium':
        return <Badge variant="default"><Flag className="w-3 h-3 mr-1" />Moyenne</Badge>;
      case 'low':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Basse</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const statusCounts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centre de modération</h1>
        <p className="text-muted-foreground">Gérez les signalements et validations en attente</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Priorité haute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {items.filter(i => i.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approuvés aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">7</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3h</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets par statut */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Tous ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approuvés ({statusCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejetés ({statusCounts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' 
                    ? 'Aucun élément en attente de modération' 
                    : 'Aucun élément trouvé'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{item.title}</h3>
                          {getTypeBadge(item.type)}
                          {getPriorityBadge(item.priority)}
                        </div>
                        <p className="text-muted-foreground">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                          {item.reporter && <span>Signalé par: {item.reporter}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Examiner
                        </Button>
                        {item.status === 'pending' && (
                          <>
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approuver
                            </Button>
                            <Button variant="destructive" size="sm">
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeter
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}