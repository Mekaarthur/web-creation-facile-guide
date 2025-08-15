import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Euro, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProviderInvoice {
  id: string;
  invoice_number: string;
  amount_brut: number;
  amount_net: number;
  tva_amount: number;
  status: string;
  issued_date: string;
  sent_date: string | null;
  payment_date: string | null;
  booking?: {
    booking_date: string;
    services: {
      name: string;
    };
  };
}

const ProviderInvoiceManagement = () => {
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProviderInvoices();
    }
  }, [user]);

  const fetchProviderInvoices = async () => {
    try {
      setLoading(true);
      
      // Get provider ID first
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (providerError) throw providerError;

      // Fetch provider invoices with booking details
      const { data, error } = await supabase
        .from('provider_invoices')
        .select(`
          id,
          invoice_number,
          amount_brut,
          amount_net,
          tva_amount,
          status,
          issued_date,
          sent_date,
          payment_date,
          booking:bookings(
            booking_date,
            services(name)
          )
        `)
        .eq('provider_id', providerData.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching provider invoices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos fiches de rémunération",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      // Simulate PDF download for provider invoices
      const link = document.createElement('a');
      link.href = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/generate-provider-invoice-pdf?id=${invoiceId}`;
      link.download = `fiche-remuneration-${invoiceId}.pdf`;
      link.click();

      toast({
        title: "Téléchargement démarré",
        description: "Votre fiche de rémunération est en cours de téléchargement",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la fiche de rémunération",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Payée', variant: 'default' as const };
      case 'sent':
        return { label: 'Envoyée', variant: 'secondary' as const };
      case 'pending':
        return { label: 'En attente', variant: 'outline' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Mes fiches de rémunération</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Mes fiches de rémunération</h2>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune fiche disponible</h3>
            <p className="text-muted-foreground">
              Vos fiches de rémunération apparaîtront ici après vos prestations terminées.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Les fiches sont générées automatiquement 4 jours après chaque prestation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBrut = invoices.reduce((sum, invoice) => sum + invoice.amount_brut, 0);
  const totalNet = invoices.reduce((sum, invoice) => sum + invoice.amount_net, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Mes fiches de rémunération</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total brut</CardDescription>
            <CardTitle className="text-2xl">{totalBrut.toFixed(2)} €</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total net</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalNet.toFixed(2)} €</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fiches payées</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{paidInvoices}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{pendingInvoices}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des rémunérations</CardTitle>
          <CardDescription>
            Vos fiches de rémunération sont émises automatiquement 4 jours après chaque prestation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Montant brut</TableHead>
                <TableHead>Montant net</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.booking?.services?.name || 'Service'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(invoice.issued_date), "dd/MM/yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold">
                        <Euro className="w-4 h-4" />
                        {invoice.amount_brut.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-green-600">
                        <Euro className="w-4 h-4" />
                        {invoice.amount_net.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderInvoiceManagement;