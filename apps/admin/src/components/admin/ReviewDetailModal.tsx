import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Review {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string | null;
  booking_id: string;
  rating: number;
  comment: string | null;
  status: 'pending' | 'published' | 'rejected' | 'deleted';
  admin_notes: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  punctuality_rating?: number;
  quality_rating?: number;
  is_approved?: boolean;
  client?: { first_name: string; last_name: string; email: string };
  provider?: { first_name: string; last_name: string };
  service?: { name: string; category: string };
}

export const getRatingStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
  ));

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200">🟡 En attente</Badge>;
    case 'published': return <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">🟢 Publié</Badge>;
    case 'rejected': return <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200">🔴 Rejeté</Badge>;
    case 'deleted': return <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">⚪ Supprimé</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export const getRatingColor = (rating: number) => {
  if (rating <= 2) return 'text-red-600';
  if (rating === 3) return 'text-orange-600';
  return 'text-green-600';
};

interface Props {
  review: Review | null;
  onClose: () => void;
  onApprove: (reviewId: string, notes: string) => void;
  onReject: (reviewId: string, notes: string) => void;
  onDelete: (reviewId: string) => void;
}

export function ReviewDetailModal({ review, onClose, onApprove, onReject, onDelete }: Props) {
  const [moderationNotes, setModerationNotes] = useState('');

  useEffect(() => {
    if (review) setModerationNotes(review.admin_notes || '');
  }, [review?.id]);

  if (!review) return null;

  const isPending = review.status === 'pending' || (!review.status && !review.is_approved);
  const displayStatus = review.status || (review.is_approved ? 'published' : 'pending');

  return (
    <Dialog open={!!review} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de l'avis</DialogTitle>
          <DialogDescription>{getStatusBadge(displayStatus)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Client</p>
                <p className="font-semibold">
                  {review.client ? `${review.client.first_name} ${review.client.last_name}` : 'Client'}
                </p>
                {review.client?.email && <p className="text-xs text-muted-foreground">{review.client.email}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Prestataire</p>
                <p className="font-semibold">
                  {review.provider ? `${review.provider.first_name} ${review.provider.last_name}` : 'Prestataire'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Évaluation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Note globale</p>
                <div className="flex items-center gap-2">
                  {getRatingStars(review.rating)}
                  <span className={`text-xl font-bold ${getRatingColor(review.rating)}`}>{review.rating}/5</span>
                </div>
              </div>
              {review.punctuality_rating && (
                <div>
                  <p className="text-sm font-medium mb-2">Ponctualité</p>
                  <div className="flex items-center gap-2">
                    {getRatingStars(review.punctuality_rating)}
                    <span className="text-sm">{review.punctuality_rating}/5</span>
                  </div>
                </div>
              )}
              {review.quality_rating && (
                <div>
                  <p className="text-sm font-medium mb-2">Qualité du travail</p>
                  <div className="flex items-center gap-2">
                    {getRatingStars(review.quality_rating)}
                    <span className="text-sm">{review.quality_rating}/5</span>
                  </div>
                </div>
              )}
              {review.comment && (
                <div>
                  <p className="text-sm font-medium mb-2">Commentaire</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm italic">"{review.comment}"</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <label className="text-sm font-medium mb-2 block">Notes de modération (privées)</label>
            <Textarea
              placeholder="Raison de l'approbation/rejet..."
              value={moderationNotes}
              onChange={e => setModerationNotes(e.target.value)}
              rows={3}
            />
          </div>

          {isPending && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={() => onApprove(review.id, moderationNotes)} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" /> Approuver et publier
              </Button>
              <Button onClick={() => onReject(review.id, moderationNotes)} className="flex-1" variant="destructive">
                <X className="w-4 h-4 mr-2" /> Rejeter
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Créé le {format(new Date(review.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            {review.moderated_at && (
              <p>Modéré le {format(new Date(review.moderated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
