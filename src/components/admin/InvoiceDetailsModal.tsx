import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Send, 
  User, 
  Calendar, 
  DollarSign,
  Building,
  MapPin,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface InvoiceDetailsModalProps {
  invoice: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const InvoiceDetailsModal = ({ invoice, onClose, onUpdate }: InvoiceDetailsModalProps) => {
  const isClientInvoice = invoice.type === 'client';

  const getStatusBadge = (status: string) => {
    const badges = {
      'draft': <Badge variant="secondary">Brouillon</Badge>,
      'issued': <Badge variant="default">Émise</Badge>,
      'paid': <Badge className="bg-green-100 text-green-800">Payée</Badge>,
      'pending': <Badge variant="secondary">En attente</Badge>,
      'refunded': <Badge variant="outline">Remboursée</Badge>,
      'cancelled': <Badge variant="destructive">Annulée</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la facture</DialogTitle>
          <DialogDescription>
            {invoice.invoice_number} - {getStatusBadge(invoice.status)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations facture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro de facture</p>
                    <p className="font-mono font-semibold">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'émission</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <p className="font-medium">
                        {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="text-2xl font-bold text-primary">
                      {invoice.amount.toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                  </div>
                </div>

                {invoice.payment_date && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Payée le {new Date(invoice.payment_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {isClientInvoice ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {invoice.client_profile
                        ? `${invoice.client_profile.first_name} ${invoice.client_profile.last_name}`
                        : 'N/A'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.client_profile?.email}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Prestataire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{invoice.provider_profile?.business_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {isClientInvoice && invoice.bookings && (
              <Card>
                <CardHeader>
                  <CardTitle>Réservation associée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{invoice.bookings.services?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.bookings.services?.category || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Heure</p>
                    <p className="font-medium">
                      {new Date(invoice.bookings.booking_date).toLocaleDateString('fr-FR')} à {invoice.bookings.start_time}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isClientInvoice && invoice.service_description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description du service</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{invoice.service_description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Répartition financière</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant total:</span>
                    <span className="font-semibold">{invoice.amount.toFixed(2)}€</span>
                  </div>
                  {isClientInvoice && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commission Bikawo (28%):</span>
                        <span className="font-medium text-amber-600">
                          {(invoice.amount * 0.28).toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prestataire (72%):</span>
                        <span className="font-medium text-green-600">
                          {(invoice.amount * 0.72).toFixed(2)}€
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {isClientInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Paiement via Stripe intégré à la transaction
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
                <Button variant="outline" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer par email
                </Button>
                {invoice.status !== 'cancelled' && (
                  <Button variant="destructive" className="w-full">
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler la facture
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mentions légales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Facture émise par Bikawo SAS - SIRET 123 456 789 00012<br />
                  TVA intracommunautaire: FR12345678900<br />
                  Conditions de paiement: Immédiat<br />
                  Conservation: 10 ans minimum (obligation légale)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
