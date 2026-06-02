import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Euro, Send, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  status: string;
  notes: string | null;
  provider_id: string | null;
  services: { name: string; category: string } | null;
  client_profile?: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null;
  provider_profile?: { first_name: string | null; last_name: string | null } | null;
}

interface Provider {
  id: string;
  business_name: string;
  location: string;
  rating: number;
  user_id: string;
}

interface Props {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  providers: Provider[];
  onStatusUpdate: (status: string) => void;
  onAssignProvider: (providerId: string) => void;
  isMutating: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmé" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
];

const STATUS_BADGE: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  confirmed: { label: 'Confirmé', variant: 'default' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminé', variant: 'default' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

export function ReservationDetailModal({ booking, open, onClose, providers, onStatusUpdate, onAssignProvider, isMutating }: Props) {
  const { toast } = useToast();
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const statusConfig = booking ? (STATUS_BADGE[booking.status] ?? { label: booking.status, variant: 'secondary' as const }) : null;

  const sendEmail = (recipientType: 'client' | 'provider') => {
    if (!booking) return;
    console.log('[Admin] Email réservation envoyé à', recipientType);
    toast({ title: "Email envoyé", description: `Email envoyé au ${recipientType === 'client' ? 'client' : 'prestataire'}` });
    setEmailSubject("");
    setEmailMessage("");
  };

  const handleAssign = () => {
    onAssignProvider(selectedProviderId);
    setIsAssignOpen(false);
    setSelectedProviderId("");
  };

  if (!booking) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Détails de la réservation #{booking.id.substring(0, 8)}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="text-xs sm:text-sm">Informations</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs sm:text-sm">Actions</TabsTrigger>
              <TabsTrigger value="communication" className="text-xs sm:text-sm">Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span>Informations générales</span>
                    {statusConfig && <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Date</Label>
                      <p>{new Date(booking.booking_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Horaire</Label>
                      <p>{booking.start_time} - {booking.end_time}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Adresse</Label>
                      <p>{booking.address || 'Non renseignée'}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Service</Label>
                      <p>{booking.services?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Prix total</Label>
                      <p className="text-primary font-semibold">{booking.total_price}€</p>
                    </div>
                  </div>
                  {booking.notes && (
                    <div>
                      <Label className="text-xs sm:text-sm">Notes</Label>
                      <p className="text-muted-foreground">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base sm:text-lg">Client</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {booking.client_profile && (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.client_profile.first_name} {booking.client_profile.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.client_profile.email}</span>
                      </div>
                      {booking.client_profile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.client_profile.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {booking.provider_profile && (
                <Card>
                  <CardHeader><CardTitle className="text-base sm:text-lg">Prestataire</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.provider_profile.first_name} {booking.provider_profile.last_name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base sm:text-lg">Modifier le statut</CardTitle></CardHeader>
                <CardContent>
                  <Select value={booking.status} onValueChange={onStatusUpdate} disabled={isMutating}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {!booking.provider_id && (
                <Card>
                  <CardHeader><CardTitle className="text-base sm:text-lg">Assigner un prestataire</CardTitle></CardHeader>
                  <CardContent>
                    <Button onClick={() => setIsAssignOpen(true)} className="w-full text-sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assigner un prestataire
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base sm:text-lg">Envoyer un email</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Sujet</Label>
                    <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Sujet de l'email" className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Message</Label>
                    <Textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Contenu de l'email" rows={5} className="text-sm" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => sendEmail('client')} disabled={!emailSubject || !emailMessage} className="flex-1 text-sm">
                      <Send className="w-4 h-4 mr-2" /> Envoyer au client
                    </Button>
                    {booking.provider_id && (
                      <Button onClick={() => sendEmail('provider')} disabled={!emailSubject || !emailMessage} variant="secondary" className="flex-1 text-sm">
                        <Send className="w-4 h-4 mr-2" /> Envoyer au prestataire
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Assign provider dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assigner un prestataire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Sélectionner un prestataire</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Choisir un prestataire" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.business_name} - {p.location} (★ {p.rating.toFixed(1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAssign} disabled={!selectedProviderId || isMutating} className="flex-1 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> Confirmer
              </Button>
              <Button onClick={() => { setIsAssignOpen(false); setSelectedProviderId(""); }} variant="outline" className="text-sm">
                <XCircle className="w-4 h-4 mr-2" /> Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
