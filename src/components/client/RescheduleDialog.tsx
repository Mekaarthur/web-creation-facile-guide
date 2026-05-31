import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Booking } from './ClientPrestationsHistory';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export function RescheduleDialog({ booking, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newDate, setNewDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setNewDate('');
      setNotes('');
    }
  }, [booking?.id]);

  const submit = async () => {
    if (!booking || !user || !newDate) {
      toast({ title: 'Date manquante', description: 'Sélectionnez une nouvelle date.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        client_id: user.id,
        booking_id: booking.id,
        provider_id: booking.provider_id,
        complaint_type: 'demande_report',
        title: `Demande de report - ${booking.services?.name || 'Prestation'}`,
        description: `Nouvelle date souhaitée : ${newDate}${notes ? `\n\nNotes : ${notes}` : ''}`,
        priority: 'medium',
        status: 'open',
      });
      if (error) throw error;

      toast({ title: 'Demande de report envoyée', description: 'Le support vous contactera pour confirmer le nouveau créneau.' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer la demande', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!booking} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Reporter le rendez-vous
          </DialogTitle>
          <DialogDescription>
            Indiquez votre nouvelle disponibilité. Le support vous confirmera le nouveau créneau sous 24h.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <strong>{booking.services?.name}</strong> · Actuellement : {format(parseISO(booking.booking_date), 'EEEE d MMM yyyy', { locale: fr })} à {booking.start_time?.slice(0, 5)}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nouvelle date souhaitée <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={newDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setNewDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(horaires préférés, contraintes...)</span></Label>
            <Textarea
              placeholder="Ex : disponible en après-midi, éviter le vendredi..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={submitting || !newDate}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
