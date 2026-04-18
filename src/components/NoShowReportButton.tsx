import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserX, AlertTriangle } from 'lucide-react';
import { useNoShowReport } from '@/hooks/useNoShowReport';
import { useAuth } from '@/hooks/useAuth';

interface NoShowReportButtonProps {
  bookingId: string;
  bookingDate: string;
  startTime: string;
  onReported?: () => void;
}

/**
 * Bouton "Signaler une absence" — utilisable côté client
 * dès que le prestataire a >15 min de retard.
 */
export const NoShowReportButton = ({
  bookingId,
  bookingDate,
  startTime,
  onReported,
}: NoShowReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const { loading, reportNoShow } = useNoShowReport();

  // Vérifier si la prestation a commencé depuis +15 min
  const bookingStart = new Date(`${bookingDate}T${startTime}`);
  const minutesLate = (Date.now() - bookingStart.getTime()) / (1000 * 60);
  const canReport = minutesLate >= 15;

  const handleReport = async () => {
    if (!user?.id) return;
    const result = await reportNoShow({
      bookingId,
      reportedBy: user.id,
      notes: notes.trim() || undefined,
    });
    if (result.success) {
      setOpen(false);
      setNotes('');
      onReported?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canReport}>
          <UserX className="w-4 h-4 mr-2" />
          {canReport
            ? 'Signaler une absence'
            : `Possible dans ${Math.max(0, Math.ceil(15 - minutesLate))} min`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Signaler l'absence du prestataire
          </DialogTitle>
          <DialogDescription>
            Le prestataire n'est pas arrivé à l'heure prévue ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              Nous chercherons immédiatement un prestataire de remplacement et
              une sanction sera appliquée à l'absent.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="noshow-notes">
              Précisions (facultatif)
            </Label>
            <Textarea
              id="noshow-notes"
              placeholder="Ex : aucune nouvelle depuis 30 min, téléphone éteint…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Retour
          </Button>
          <Button variant="destructive" onClick={handleReport} disabled={loading}>
            {loading ? 'Envoi…' : 'Confirmer le signalement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
