import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Booking } from './ClientPrestationsHistory';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

const ANOMALY_TYPES = [
  { value: 'retard',   label: 'Retard du prestataire',       complaint_type: 'delay',    priority: 'medium' },
  { value: 'absence',  label: 'Prestataire absent',           complaint_type: 'absence',  priority: 'high'   },
  { value: 'qualite',  label: 'Qualité insuffisante',         complaint_type: 'quality',  priority: 'medium' },
  { value: 'attitude', label: 'Comportement inapproprié',     complaint_type: 'attitude', priority: 'high'   },
  { value: 'autre',    label: 'Autre',                        complaint_type: 'other',    priority: 'low'    },
] as const;

export function AnomalyReportDialog({ booking, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [anomalyType, setAnomalyType] = useState('');
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) { setAnomalyType(''); setReportText(''); }
  }, [booking?.id]);

  const submit = async () => {
    if (!booking || !user) return;
    if (!anomalyType) {
      toast({ title: 'Type obligatoire', description: 'Veuillez sélectionner un type d\'anomalie.', variant: 'destructive' });
      return;
    }
    if (reportText.trim().length < 10) {
      toast({ title: 'Description trop courte', description: 'Merci de décrire l\'anomalie (10 caractères min).', variant: 'destructive' });
      return;
    }
    const typeConfig = ANOMALY_TYPES.find(t => t.value === anomalyType)!;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        client_id: user.id,
        booking_id: booking.id,
        provider_id: booking.provider_id,
        complaint_type: typeConfig.complaint_type,
        title: `Anomalie (${typeConfig.label}) - ${booking.services?.name || 'Prestation'}`,
        description: reportText.trim(),
        priority: typeConfig.priority,
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
        <div className="space-y-1.5">
          <Label>Type d'anomalie <span className="text-destructive">*</span></Label>
          <Select value={anomalyType} onValueChange={setAnomalyType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type..." />
            </SelectTrigger>
            <SelectContent>
              {ANOMALY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Description <span className="text-destructive">*</span></Label>
          <Textarea
            placeholder="Expliquez l'anomalie : montant incorrect, prestation non réalisée, écart d'horaire..."
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{reportText.length}/1000</p>
        </div>
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
