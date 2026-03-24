import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2, Phone, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyReportButtonProps {
  providerId: string;
  currentBookingId?: string;
}

const EMERGENCY_TYPES = [
  { value: 'safety_concern', label: 'Problème de sécurité personnelle' },
  { value: 'client_emergency', label: 'Urgence médicale client' },
  { value: 'accident', label: 'Accident sur le lieu d\'intervention' },
  { value: 'aggressive_behavior', label: 'Comportement agressif / menaçant' },
  { value: 'property_damage', label: 'Dégât matériel important' },
  { value: 'other', label: 'Autre urgence' },
];

export const EmergencyReportButton = ({ providerId, currentBookingId }: EmergencyReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!type || !description.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSending(true);

      // Créer l'incident dans la table incidents
      const { error: incidentError } = await supabase
        .from('incidents')
        .insert({
          type: type,
          description: description.trim(),
          severity: ['safety_concern', 'aggressive_behavior', 'client_emergency'].includes(type) ? 'critical' : 'high',
          status: 'open',
          reported_by: providerId,
          booking_id: currentBookingId || null,
          metadata: { source: 'provider_emergency_report' }
        });

      if (incidentError) throw incidentError;

      // Notification urgente pour l'admin
      await supabase
        .from('communications')
        .insert({
          type: 'notification',
          destinataire_id: null,
          sujet: '🚨 ALERTE URGENCE PRESTATAIRE',
          contenu: `Un prestataire signale une urgence : ${EMERGENCY_TYPES.find(t => t.value === type)?.label}. Description : ${description.trim()}. Provider ID : ${providerId}`,
          related_entity_type: 'incident',
          related_entity_id: providerId,
          status: 'en_attente'
        });

      toast.success('Alerte envoyée', {
        description: 'L\'équipe a été notifiée. Nous vous contactons rapidement.'
      });

      setOpen(false);
      setType('');
      setDescription('');
    } catch (error: any) {
      toast.error('Erreur lors de l\'envoi', { description: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2 shadow-lg"
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="hidden sm:inline">Signaler une urgence</span>
          <span className="sm:hidden">Urgence</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Signaler une urgence
          </DialogTitle>
          <DialogDescription>
            Votre sécurité est notre priorité. L'équipe sera immédiatement alertée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Numéro d'urgence */}
          <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <Phone className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">En cas de danger immédiat</p>
              <p className="text-xs text-muted-foreground">Appelez le 15 (SAMU), 17 (Police) ou 18 (Pompiers)</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type d'urgence *</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type d'urgence" />
              </SelectTrigger>
              <SelectContent>
                {EMERGENCY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Décrivez la situation (lieu, personnes impliquées, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={sending || !type || !description.trim()}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Envoyer l'alerte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyReportButton;
