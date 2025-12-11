import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Star, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DetailedRatingForm } from './DetailedRatingForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PendingReview {
  id: string;
  booking_date: string;
  provider_id: string;
  provider_name: string;
  service_name: string;
  total_price: number;
}

export const PendingReviews = () => {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PendingReview | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingReviews();
    }
  }, [user]);

  const loadPendingReviews = async () => {
    if (!user) return;

    try {
      // Récupérer les réservations complétées sans avis
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          total_price,
          provider_id,
          providers (
            id,
            business_name
          ),
          services (name)
        `)
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .order('booking_date', { ascending: false });

      if (error) throw error;

      // Filtrer celles qui n'ont pas d'avis
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('booking_id')
        .eq('client_id', user.id);

      const reviewedBookingIds = new Set(existingReviews?.map(r => r.booking_id) || []);

      const pending = (bookings || [])
        .filter(b => !reviewedBookingIds.has(b.id))
        .map(b => ({
          id: b.id,
          booking_date: b.booking_date,
          provider_id: b.provider_id,
          provider_name: (b.providers as any)?.business_name || 'Prestataire',
          service_name: (b.services as any)?.name || 'Service',
          total_price: b.total_price
        }));

      setPendingReviews(pending);
    } catch (error) {
      console.error('Erreur chargement avis en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    setDialogOpen(false);
    setSelectedBooking(null);
    loadPendingReviews();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (pendingReviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-muted-foreground">Vous avez évalué toutes vos prestations !</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Évaluations en attente
          <Badge variant="secondary">{pendingReviews.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingReviews.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <p className="font-medium">{booking.service_name}</p>
                <p className="text-sm text-muted-foreground">
                  avec {booking.provider_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(booking.booking_date), 'PPP', { locale: fr })}
                </div>
              </div>
              <Dialog open={dialogOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setSelectedBooking(null);
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setDialogOpen(true);
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Évaluer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  {selectedBooking && (
                    <DetailedRatingForm
                      bookingId={selectedBooking.id}
                      providerId={selectedBooking.provider_id}
                      providerName={selectedBooking.provider_name}
                      serviceName={selectedBooking.service_name}
                      onSuccess={handleReviewSuccess}
                      onCancel={() => {
                        setDialogOpen(false);
                        setSelectedBooking(null);
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
