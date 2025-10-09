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
import { XCircle, AlertTriangle, Euro } from 'lucide-react';
import { useBookingWorkflow } from '@/hooks/useBookingWorkflow';

interface BookingCancellationProps {
  bookingId: string;
  bookingDate: string;
  startTime: string;
  totalPrice: number;
  cancelledBy: 'client' | 'provider';
  onCancelled?: () => void;
}

export const BookingCancellation = ({
  bookingId,
  bookingDate,
  startTime,
  totalPrice,
  cancelledBy,
  onCancelled
}: BookingCancellationProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { loading, cancelBooking, calculateRefundAmount } = useBookingWorkflow();

  const { refundAmount, refundPercentage } = calculateRefundAmount(
    bookingDate,
    startTime,
    totalPrice
  );

  const handleCancel = async () => {
    if (!reason.trim()) {
      return;
    }

    const result = await cancelBooking(bookingId, reason, cancelledBy);
    if (result.success) {
      setOpen(false);
      setReason('');
      onCancelled?.();
    }
  };

  const getPolicyMessage = () => {
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const hoursUntil = (bookingDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 24) {
      return "Remboursement intégral (100%)";
    } else if (hoursUntil >= 2) {
      return "Remboursement partiel (50%)";
    } else {
      return "Aucun remboursement (moins de 2h avant la prestation)";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="w-4 h-4 mr-2" />
          Annuler la réservation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Annuler la réservation
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Veuillez confirmer l'annulation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Politique de remboursement */}
          <Alert>
            <Euro className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Conditions de remboursement</div>
              <div className="text-sm">
                {getPolicyMessage()}
              </div>
              <div className="mt-2 text-sm font-bold">
                Montant remboursé : {refundAmount.toFixed(2)}€ sur {totalPrice.toFixed(2)}€
              </div>
            </AlertDescription>
          </Alert>

          {/* Raison de l'annulation */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Raison de l'annulation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Expliquez pourquoi vous souhaitez annuler cette réservation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Attention :</strong> L'annulation sera immédiate et le {cancelledBy === 'client' ? 'prestataire' : 'client'} sera notifié.
              {refundAmount > 0 && ' Le remboursement sera traité sous 3-5 jours ouvrés.'}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Retour
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
