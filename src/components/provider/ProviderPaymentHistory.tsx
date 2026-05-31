import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Euro, TrendingUp, Calendar, RefreshCw, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: string;
  booking_id: string | null;
  service_category: string | null;
  provider_payment: number;
  payment_status: string;
  provider_paid_at: string | null;
  created_at: string;
  paid_via: string | null;
  bookings: { scheduled_date: string | null; status: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid:      { label: 'Payé',         className: 'bg-green-100 text-green-700 border-green-200' },
  completed: { label: 'Complété',     className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Annulé',       className: 'bg-gray-100 text-gray-600 border-gray-200' },
  refunded:  { label: 'Remboursé',    className: 'bg-red-100 text-red-700 border-red-200' },
};

const CATEGORY_LABEL: Record<string, string> = {
  bika_maison:  'Bika Maison',
  bika_kids:    'Bika Kids',
  bika_vie:     'Bika Vie',
  bika_animals: 'Bika Animals',
  bika_plus:    'Bika+',
  bika_seniors: 'Bika Seniors',
  bika_travel:  'Bika Travel',
  bika_pro:     'Bika Pro',
};

interface Props {
  providerId: string;
}

async function fetchTransactions(providerId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, booking_id, service_category, provider_payment, payment_status, provider_paid_at, created_at, paid_via, bookings(scheduled_date, status)')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as Transaction[]) || [];
}

export const ProviderPaymentHistory = ({ providerId }: Props) => {
  const { data: transactions = [], isLoading, isError, refetch } = useQuery<Transaction[]>({
    queryKey: ['provider-transactions', providerId],
    queryFn: () => fetchTransactions(providerId),
    enabled: !!providerId,
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const { monthTotal, cumulTotal } = useMemo(() => {
    const paid = transactions.filter(t => t.payment_status === 'paid' || t.payment_status === 'completed');
    const monthTotal = paid
      .filter(t => {
        const d = new Date(t.provider_paid_at || t.created_at);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, t) => sum + (t.provider_payment || 0), 0);
    const cumulTotal = paid.reduce((sum, t) => sum + (t.provider_payment || 0), 0);
    return { monthTotal, cumulTotal };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Impossible de charger l'historique.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ce mois</p>
              <p className="text-2xl font-bold text-blue-600">{monthTotal.toFixed(2)} €</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total cumulé</p>
              <p className="text-2xl font-bold text-green-600">{cumulTotal.toFixed(2)} €</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-primary" />
            Historique des paiements
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Euro className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Aucune transaction pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => {
                const status = STATUS_CONFIG[tx.payment_status] ?? STATUS_CONFIG.pending;
                const date   = tx.provider_paid_at || tx.created_at;
                const missionDate = tx.bookings?.scheduled_date;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-medium text-sm">
                        {tx.service_category ? (CATEGORY_LABEL[tx.service_category] ?? tx.service_category) : 'Service'}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{format(new Date(date), 'd MMM yyyy', { locale: fr })}</span>
                        {missionDate && (
                          <span>Mission : {format(new Date(missionDate), 'd MMM yyyy', { locale: fr })}</span>
                        )}
                        {tx.paid_via && tx.paid_via !== 'manual' && (
                          <span className="capitalize">{tx.paid_via}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <Badge className={`text-xs border ${status.className}`}>{status.label}</Badge>
                      <span className="font-bold text-base text-green-700 tabular-nums">
                        +{(tx.provider_payment || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
