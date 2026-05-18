import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Check, X, Loader2, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FavoriteRequest {
  id: string;
  client_id: string;
  booking_id: string | null;
  created_at: string;
  client: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export const ProviderFavoriteRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState<FavoriteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadPending();
  }, [user]);

  const loadPending = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: providerRow } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!providerRow) { setLoading(false); return; }
      setProviderId(providerRow.id);

      const { data, error } = await supabase.functions.invoke('manage-favorites', {
        body: { action: 'list_pending', providerId: providerRow.id },
      });

      if (error) throw error;
      setPending(data?.pending || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les demandes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const respond = async (request: FavoriteRequest, response: 'accepted' | 'declined') => {
    if (!providerId) return;
    setResponding(request.id);
    try {
      const { error } = await supabase.functions.invoke('manage-favorites', {
        body: { action: 'respond', providerId, response },
      });
      if (error) throw error;

      setPending(prev => prev.filter(p => p.id !== request.id));
      toast({
        title: response === 'accepted' ? 'Binôme accepté !' : 'Demande déclinée',
        description: response === 'accepted'
          ? 'Vous êtes maintenant en binôme avec ce client.'
          : 'La demande a été déclinée.',
      });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible de répondre', variant: 'destructive' });
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement...
        </CardContent>
      </Card>
    );
  }

  if (pending.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-pink-500" />
            Demandes de binôme
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          Aucune demande de binôme en attente.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-pink-500" />
          Demandes de binôme
          <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((req) => {
          const clientName = req.client
            ? `${req.client.first_name ?? ''} ${req.client.last_name ?? ''}`.trim() || req.client.email || 'Client'
            : 'Client';
          const isResponding = responding === req.id;

          return (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg bg-pink-50/50 border-pink-100"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-500" />
                  <span className="font-medium">{clientName}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demande reçue le {format(parseISO(req.created_at), 'd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ce client souhaite vous avoir comme prestataire privilégié pour ses futures missions.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isResponding}
                  onClick={() => respond(req, 'declined')}
                >
                  {isResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Décliner
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={isResponding}
                  onClick={() => respond(req, 'accepted')}
                >
                  {isResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Accepter
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
