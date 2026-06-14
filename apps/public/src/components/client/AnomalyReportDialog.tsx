import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Booking } from './ClientPrestationsHistory';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export function AnomalyReportDialog({ booking, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) setReportText('');
  }, [booking?.id]);

  const submit = async () => {
    if (!booking || !user || reportText.trim().length < 10) {
      toast({ title: 'Description trop courte', description: 'Merci de décrire l\'anomalie (10 caractères min).', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        client_id: user.id,
        booking_id: booking.id,
        provider_id: booking.provider_id,
        complaint_type: 'quality',
        title: `Anomalie - ${booking.services?.name || 'Prestation'}`,
        description: reportText.trim(),
        priority: 'medium',
      });
      if (error) throw error;

      supabase.functions.invoke('send-modern-notification', {
        body: {
          type: 'anomaly_report',
          recipient: { email: 'contact@bikawo.com', name: 'Admin Bikawo' },
          data: {
            bookingId: booking.id,
            serviceName: booking.services?.name,
            bookingDate: booking.booking_date,
            description: reportText.trim(),
            contactEmail: user.email,
          },
        },
      }).catch(() => {});

      toast({ title: 'Signalement envoyé', description: 'Notre support vous répondra sous 48h ouvrées.' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le signalement', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!booking} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Signaler une anomalie
          </DialogTitle>
          <DialogDescription>
            Décrivez l'anomalie constatée sur cette prestation. Notre support vous répondra sous 48h ouvrées.
          </DialogDescription>
        </DialogHeader>
        {booking && (
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <strong>{booking.services?.name}</strong> · {format(parseISO(booking.booking_date), 'd MMM yyyy', { locale: fr })}
          </div>
        )}
        <Textarea
          placeholder="Expliquez l'anomalie : montant incorrect, prestation non réalisée, écart d'horaire..."
          value={reportText}
          onChange={e => setReportText(e.target.value)}
          rows={5}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">{reportText.length}/1000</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
