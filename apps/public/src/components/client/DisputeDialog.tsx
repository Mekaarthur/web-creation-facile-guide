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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Scale, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Booking } from './ClientPrestationsHistory';

const DISPUTE_PRIORITY: Record<string, string> = {
  paiement: 'high',
  no_show: 'high',
  qualite: 'medium',
  retard: 'medium',
  autre: 'low',
};

const DISPUTE_TYPE_MAP: Record<string, string> = {
  qualite: 'quality',
  paiement: 'payment',
  no_show: 'absence',
  retard: 'delay',
  autre: 'other',
};

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export function DisputeDialog({ booking, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputeType, setDisputeType] = useState('qualite');
  const [disputeResolution, setDisputeResolution] = useState('remboursement');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeAmount, setDisputeAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setDisputeType('qualite');
      setDisputeResolution('remboursement');
      setDisputeDesc('');
      setDisputeAmount('');
    }
  }, [booking?.id]);

  const submit = async () => {
    if (!booking || !user || disputeDesc.trim().length < 20) {
      toast({ title: 'Description insuffisante', description: 'Décrivez votre litige en au moins 20 caractères.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const priority = DISPUTE_PRIORITY[disputeType] || 'medium';
      const amountNum = disputeAmount ? parseFloat(disputeAmount) : null;

      const { error } = await supabase.from('complaints').insert({
        client_id: user.id,
        booking_id: booking.id,
        provider_id: booking.provider_id,
        complaint_type: DISPUTE_TYPE_MAP[disputeType] || 'other',
        title: `Litige ${disputeType} - ${booking.services?.name || 'Prestation'}`,
        description: `[Résolution souhaitée : ${disputeResolution}${amountNum ? ` (${amountNum}€)` : ''}]\n\n${disputeDesc.trim()}`,
        priority,
      });
      if (error) throw error;

      supabase.functions.invoke('send-modern-notification', {
        body: {
          type: 'dispute_opened',
          recipient: { email: 'admin@bikawo.com', name: 'Admin Bikawo', firstName: 'Admin' },
          data: {
            clientName: user.email,
            bookingId: booking.id,
            serviceDescription: `Litige "${disputeType}" — résolution souhaitée : ${disputeResolution}\n\n${disputeDesc.trim()}`,
            message: disputeType,
          },
        },
      }).catch(() => {});

      toast({ title: 'Litige ouvert', description: 'Notre équipe traitera votre demande sous 72h ouvrées.' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le litige', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!booking} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            Ouvrir un litige
          </DialogTitle>
          <DialogDescription>
            Décrivez votre litige. Notre équipe de médiation traitera votre demande sous 72h ouvrées.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <strong>{booking.services?.name}</strong> · {format(parseISO(booking.booking_date), 'd MMM yyyy', { locale: fr })} · {booking.total_price.toFixed(2)}€
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de litige</Label>
              <Select value={disputeType} onValueChange={setDisputeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualite">Qualité de service</SelectItem>
                  <SelectItem value="paiement">Problème de paiement</SelectItem>
                  <SelectItem value="no_show">Prestataire absent</SelectItem>
                  <SelectItem value="retard">Retard important</SelectItem>
                  <SelectItem value="securite">Problème de sécurité</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Résolution souhaitée</Label>
              <Select value={disputeResolution} onValueChange={setDisputeResolution}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remboursement">Remboursement</SelectItem>
                  <SelectItem value="avoir">Avoir / Bon de réduction</SelectItem>
                  <SelectItem value="rescheduling">Prestation refaite</SelectItem>
                  <SelectItem value="excuse">Excuse formelle</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(disputeResolution === 'remboursement' || disputeResolution === 'avoir') && (
            <div className="space-y-1.5">
              <Label>Montant demandé (€) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                type="number"
                placeholder={booking?.total_price.toString()}
                value={disputeAmount}
                onChange={e => setDisputeAmount(e.target.value)}
                min={0}
                max={booking?.total_price}
                step={0.01}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Description <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Décrivez précisément les faits : date, heure, ce qui s'est passé, preuves disponibles..."
              value={disputeDesc}
              onChange={e => setDisputeDesc(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{disputeDesc.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Soumettre le litige
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
