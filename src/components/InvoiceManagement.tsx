import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  issued_date: string;
  due_date: string;
  service_description: string;
  booking?: {
    booking_date: string;
    service: {
      name: string;
    };
  };
}

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      // Utiliser la table bookings pour simuler les factures en attendant la mise à jour des types
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          booking_date,
          client_id,
          service:services (name)
        `)
        .eq('client_id', user?.id)
        .eq('status', 'completed')
        .order('booking_date', { ascending: false });

      if (error) throw error;
      
      // Transformer les bookings en format facture
      const invoiceData = (data || []).map((booking, index) => ({
        id: booking.id,
        booking_id: booking.id,
        invoice_number: `2025-${String(index + 1).padStart(6, '0')}`,
        amount: booking.total_price || 0,
        status: 'paid' as const,
        issued_date: booking.booking_date,
        due_date: booking.booking_date,
        service_description: booking.service?.name || 'Service Bikawo',
        booking: {
          booking_date: booking.booking_date,
          service: booking.service
        }
      }));
      
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      // Ici vous pouvez intégrer votre service de génération de PDF
      // Par exemple avec jsPDF ou en appelant une fonction edge
      toast({
        title: "Téléchargement",
        description: "Le téléchargement de la facture va commencer...",
      });
      
      // Simulation du téléchargement
      const link = document.createElement('a');
      link.href = `/api/invoices/${invoiceId}/download`;
      link.download = `facture-${invoiceId}.pdf`;
      link.click();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "En attente", variant: "outline" as const },
      paid: { label: "Payée", variant: "default" as const },
      overdue: { label: "En retard", variant: "destructive" as const }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes factures</h2>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos factures Bikawo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {invoices.length} facture{invoices.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
            <p className="text-muted-foreground text-center">
              Vos factures apparaîtront ici après vos premiers services
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historique des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const statusInfo = getStatusBadge(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invoice.booking?.service?.name || invoice.service_description}
                          </p>
                          {invoice.booking?.booking_date && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(invoice.booking.booking_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.issued_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {invoice.amount.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Ouvrir la prévisualisation
                              window.open(`/invoices/${invoice.id}/preview`, '_blank');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Résumé des factures */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total facturé</p>
                <p className="text-2xl font-bold">
                  {invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}€
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factures payées</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                ✓
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
              <Badge variant="outline">
                ⏳
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceManagement;