import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, FileText, Download, Mail, Eye, DollarSign, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  payment_date?: string;
  service_description?: string;
  notes?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  bookings?: {
    id: string;
    services: {
      name: string;
    };
  };
}

interface InvoiceStats {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  total_count: number;
}

export default function AdminFactures() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    overdue_amount: 0,
    total_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Charger les factures avec les données client
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles:client_id (first_name, last_name),
          bookings:booking_id (
            id,
            services:service_id (name)
          )
        `)
        .order('issued_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices((invoicesData as any) || []);

      // Calculer les statistiques
      if (invoicesData) {
        const stats = invoicesData.reduce((acc, invoice) => {
          acc.total_amount += invoice.amount;
          acc.total_count += 1;
          
          if (invoice.status === 'paid') {
            acc.paid_amount += invoice.amount;
          } else if (invoice.status === 'pending') {
            acc.pending_amount += invoice.amount;
            // Vérifier si en retard
            if (new Date(invoice.due_date) < new Date()) {
              acc.overdue_amount += invoice.amount;
            }
          }
          
          return acc;
        }, {
          total_amount: 0,
          paid_amount: 0,
          pending_amount: 0,
          overdue_amount: 0,
          total_count: 0
        });
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Simuler le téléchargement (à implémenter avec un service PDF)
      const invoiceUrl = `https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/generate-invoice-pdf?invoice_id=${invoice.id}`;
      window.open(invoiceUrl, '_blank');
      
      toast({
        title: "Téléchargement en cours",
        description: `Facture ${invoice.invoice_number} en cours de téléchargement`,
      });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la facture",
        variant: "destructive"
      });
    }
  };

  const sendInvoiceEmail = async (invoice: Invoice) => {
    try {
      // Envoyer l'email de facture
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoice_id: invoice.id }
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: `Facture ${invoice.invoice_number} envoyée par email`,
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const clientName = invoice.profiles ? 
      `${invoice.profiles.first_name} ${invoice.profiles.last_name}` : '';
    const searchableText = `${clientName} ${invoice.invoice_number} ${invoice.service_description || ''}`;
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Payée</Badge>;
    }
    if (status === 'pending') {
      const isOverdue = new Date(dueDate) < new Date();
      return isOverdue ? 
        <Badge variant="destructive">En retard</Badge> :
        <Badge variant="secondary">En attente</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="outline">Annulée</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Factures clients</h1>
        <p className="text-muted-foreground">Gestion des factures émises aux clients</p>
      </div>

      {/* Statistiques des factures */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Total facturé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.total_amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.total_count} factures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Payées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{stats.paid_amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Encaissées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">€{stats.pending_amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{stats.overdue_amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">À relancer</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechercher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par client, numéro de facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>
            {filteredInvoices.length} facture(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const clientName = invoice.profiles ? 
                  `${invoice.profiles.first_name} ${invoice.profiles.last_name}` : 
                  'Client inconnu';
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>{clientName}</TableCell>
                    <TableCell>{invoice.service_description || invoice.bookings?.services?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issued_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">€{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status, invoice.due_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la facture</DialogTitle>
                            </DialogHeader>
                            {selectedInvoice && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="font-medium">Numéro:</span> {selectedInvoice.invoice_number}</div>
                                  <div><span className="font-medium">Montant:</span> €{selectedInvoice.amount.toFixed(2)}</div>
                                  <div><span className="font-medium">Client:</span> {clientName}</div>
                                  <div><span className="font-medium">Statut:</span> {getStatusBadge(selectedInvoice.status, selectedInvoice.due_date)}</div>
                                  <div><span className="font-medium">Émise le:</span> {format(new Date(selectedInvoice.issued_date), 'dd/MM/yyyy', { locale: fr })}</div>
                                  <div><span className="font-medium">Échéance:</span> {format(new Date(selectedInvoice.due_date), 'dd/MM/yyyy', { locale: fr })}</div>
                                </div>
                                {selectedInvoice.notes && (
                                  <div>
                                    <span className="font-medium">Notes:</span>
                                    <p className="text-muted-foreground mt-1">{selectedInvoice.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadInvoicePDF(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => sendInvoiceEmail(invoice)}
                        >
                          <Mail className="w-4 h-4" />
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
    </div>
  );
}