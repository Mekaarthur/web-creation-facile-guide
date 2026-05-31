import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Clock, Mail, Repeat, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Reservation, FinancialTransaction } from "./types";

interface Props {
  reservation: Reservation;
  financialTransaction: FinancialTransaction | null;
  stripePaymentIntentId: string | null;
  isLoading: boolean;
  cancellationReason: string;
  setCancellationReason: (v: string) => void;
  newDate: string;
  setNewDate: (v: string) => void;
  newStartTime: string;
  setNewStartTime: (v: string) => void;
  newEndTime: string;
  setNewEndTime: (v: string) => void;
  handleModifyDateTime: () => Promise<void>;
  handleApprove: () => Promise<void>;
  handleConvertToMission: () => Promise<void>;
  handleRefund: () => Promise<void>;
}

export function ReservationActionsTab({
  reservation, financialTransaction, stripePaymentIntentId, isLoading,
  cancellationReason, setCancellationReason,
  newDate, setNewDate, newStartTime, setNewStartTime, newEndTime, setNewEndTime,
  handleModifyDateTime, handleApprove, handleConvertToMission, handleRefund,
}: Props) {
  const { toast } = useToast();

  return (
    <TabsContent value="actions" className="space-y-4">
      {reservation.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Modifier date et horaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div>
                <Label>Heure début</Label>
                <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
              </div>
              <div>
                <Label>Heure fin</Label>
                <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleModifyDateTime} disabled={isLoading} className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contacter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = `mailto:${reservation.client_profile?.email}`}
          >
            <Mail className="mr-2 h-4 w-4" />
            Envoyer un email au client
          </Button>
          {reservation.provider_id && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                const { data } = await supabase
                  .from('providers')
                  .select('profiles!providers_user_id_fkey(email)')
                  .eq('id', reservation.provider_id!)
                  .single() as { data: any; error: any };
                const email = data?.profiles?.email;
                if (email) window.location.href = `mailto:${email}`;
                else toast({ title: "Email introuvable", description: "Le prestataire n'a pas d'email renseigné", variant: "destructive" });
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Envoyer un email au prestataire
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions administrateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reservation.status === 'pending' && (
            <Button onClick={handleApprove} disabled={isLoading} className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approuver la réservation
            </Button>
          )}

          {reservation.status === 'confirmed' && (
            <Button onClick={handleConvertToMission} disabled={isLoading} className="w-full">
              <Repeat className="mr-2 h-4 w-4" />
              Convertir en mission active
            </Button>
          )}

          {financialTransaction && financialTransaction.payment_status === 'paid' && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://dashboard.stripe.com/payments/${stripePaymentIntentId || financialTransaction.id}`, '_blank')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir paiement Stripe
            </Button>
          )}

          {reservation.status !== 'cancelled' && (
            <>
              <div className="border-t pt-3">
                <Label>Annuler et rembourser</Label>
                <Textarea
                  placeholder="Raison de l'annulation (obligatoire)..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleRefund}
                disabled={isLoading || !cancellationReason}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Annuler et rembourser
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
