import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, Calendar, TrendingUp, Users, Euro, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

interface ReportData {
  bookings: any[];
  payments: any[];
  providers: any[];
  clients: any[];
  period: { start: string; end: string };
}

export const AutomatedReports = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  const getDateRange = (period: 'week' | 'month' | 'quarter') => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchReportData = async (): Promise<ReportData> => {
    const { start, end } = getDateRange(period);
    
    const [bookingsRes, paymentsRes, providersRes, clientsRes] = await Promise.all([
      supabase.from('bookings').select('id, status, total_price, created_at, services(name)').gte('created_at', start).lte('created_at', end).limit(5000),
      supabase.from('payments').select('id, status, amount, created_at').gte('created_at', start).lte('created_at', end).limit(5000),
      supabase.from('providers').select('id, first_name, last_name, email, city, created_at').gte('created_at', start).lte('created_at', end).limit(5000),
      supabase.from('profiles').select('id, first_name, last_name, email, created_at').gte('created_at', start).lte('created_at', end).limit(5000),
    ]);
    
    return {
      bookings: bookingsRes.data || [],
      payments: paymentsRes.data || [],
      providers: providersRes.data || [],
      clients: clientsRes.data || [],
      period: { start, end }
    };
  };

  const generateExcelReport = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      const workbook = new ExcelJS.Workbook();

      // Feuille Résumé
      const summarySheet = workbook.addWorksheet('Résumé');
      summarySheet.getColumn(1).width = 30;
      summarySheet.getColumn(2).width = 20;
      [
        ['RAPPORT BIKAWO', ''],
        ['Période', `${new Date(data.period.start).toLocaleDateString('fr-FR')} - ${new Date(data.period.end).toLocaleDateString('fr-FR')}`],
        ['', ''],
        ['RÉSUMÉ', ''],
        ['Total réservations', data.bookings.length],
        ['Réservations complétées', data.bookings.filter(b => b.status === 'completed').length],
        ['Taux de complétion', `${data.bookings.length ? Math.round((data.bookings.filter(b => b.status === 'completed').length / data.bookings.length) * 100) : 0}%`],
        ['', ''],
        ["Chiffre d'affaires", `${data.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0)} €`],
        ['Paiements en attente', `${data.payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)} €`],
        ['', ''],
        ['Nouveaux prestataires', data.providers.length],
        ['Nouveaux clients', data.clients.length],
      ].forEach(row => summarySheet.addRow(row));

      // Feuille Réservations
      if (data.bookings.length > 0) {
        const bookingsSheet = workbook.addWorksheet('Réservations');
        bookingsSheet.columns = [
          { header: 'ID',      key: 'id',      width: 10 },
          { header: 'Date',    key: 'date',    width: 12 },
          { header: 'Service', key: 'service', width: 20 },
          { header: 'Statut',  key: 'statut',  width: 12 },
          { header: 'Prix',    key: 'prix',    width: 10 },
          { header: 'Créé le', key: 'created', width: 12 },
        ];
        bookingsSheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        });
        data.bookings.forEach(b => {
          bookingsSheet.addRow({
            id:      b.id.slice(0, 8),
            date:    new Date(b.booking_date).toLocaleDateString('fr-FR'),
            service: b.services?.name || 'N/A',
            statut:  b.status,
            prix:    `${b.total_price} €`,
            created: new Date(b.created_at).toLocaleDateString('fr-FR'),
          });
        });
      }

      // Feuille Paiements
      if (data.payments.length > 0) {
        const paymentsSheet = workbook.addWorksheet('Paiements');
        paymentsSheet.columns = [
          { header: 'ID',      key: 'id',      width: 10 },
          { header: 'Montant', key: 'montant', width: 12 },
          { header: 'Statut',  key: 'statut',  width: 12 },
          { header: 'Méthode', key: 'methode', width: 15 },
          { header: 'Date',    key: 'date',    width: 12 },
        ];
        paymentsSheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        });
        data.payments.forEach(p => {
          paymentsSheet.addRow({
            id:      p.id.slice(0, 8),
            montant: `${p.amount} €`,
            statut:  p.status,
            methode: p.payment_method,
            date:    new Date(p.created_at).toLocaleDateString('fr-FR'),
          });
        });
      }

      // Téléchargement
      const fileName = `rapport-bikawo-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Rapport Excel généré avec succès');
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const generateCSVReport = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      
      // Create CSV content
      let csv = 'Type,ID,Date,Montant,Statut\n';
      
      data.bookings.forEach(b => {
        csv += `Réservation,${b.id.slice(0, 8)},${new Date(b.booking_date).toLocaleDateString('fr-FR')},${b.total_price}€,${b.status}\n`;
      });
      
      data.payments.forEach(p => {
        csv += `Paiement,${p.id.slice(0, 8)},${new Date(p.created_at).toLocaleDateString('fr-FR')},${p.amount}€,${p.status}\n`;
      });
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rapport-bikawo-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Rapport CSV généré avec succès');
    } catch (error) {
      console.error('Erreur génération CSV:', error);
      toast.error('Erreur lors de la génération du CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Rapports automatisés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : '90 jours'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={generateExcelReport}
            disabled={loading}
            className="gap-2"
            variant="default"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Télécharger Excel
          </Button>
          
          <Button
            onClick={generateCSVReport}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Télécharger CSV
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Contenu du rapport</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Réservations
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Paiements
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Prestataires
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Clients
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
