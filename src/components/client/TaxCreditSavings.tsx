import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PiggyBank, 
  TrendingUp, 
  Calculator, 
  Euro, 
  Calendar,
  FileText,
  Loader2,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavingsData {
  totalSpent: number;
  taxCreditAmount: number;
  eligibleAmount: number;
  nonEligibleAmount: number;
  byCategory: { category: string; amount: number; savings: number }[];
  byMonth: { month: string; amount: number; savings: number }[];
  yearToDate: number;
}

// Services non éligibles au crédit d'impôt
const NON_ELIGIBLE_SERVICES = ['bika travel', 'bika pro', 'bika plus'];

export const TaxCreditSavings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalSpent: 0,
    taxCreditAmount: 0,
    eligibleAmount: 0,
    nonEligibleAmount: 0,
    byCategory: [],
    byMonth: [],
    yearToDate: 0
  });

  useEffect(() => {
    if (user) {
      loadSavingsData();
    }
  }, [user, year]);

  const loadSavingsData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Récupérer les réservations payées de l'année
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          booking_date,
          status,
          services (
            name,
            category
          )
        `)
        .eq('client_id', user.id)
        .in('status', ['completed', 'confirmed'])
        .gte('booking_date', startOfYear)
        .lte('booking_date', endOfYear);

      if (error) throw error;

      // Calculer les économies
      let totalSpent = 0;
      let eligibleAmount = 0;
      let nonEligibleAmount = 0;
      const categoryMap = new Map<string, { amount: number; savings: number }>();
      const monthMap = new Map<string, { amount: number; savings: number }>();

      (bookings || []).forEach((booking) => {
        const amount = booking.total_price || 0;
        const category = booking.services?.category || 'Autre';
        const serviceName = booking.services?.name?.toLowerCase() || '';
        const month = format(new Date(booking.booking_date), 'MMMM', { locale: fr });
        
        totalSpent += amount;

        // Vérifier si le service est éligible au crédit d'impôt
        const isEligible = !NON_ELIGIBLE_SERVICES.some(s => serviceName.includes(s));
        
        if (isEligible) {
          eligibleAmount += amount;
          const savings = amount * 0.5; // 50% de crédit d'impôt
          
          // Par catégorie
          const existing = categoryMap.get(category) || { amount: 0, savings: 0 };
          categoryMap.set(category, {
            amount: existing.amount + amount,
            savings: existing.savings + savings
          });
          
          // Par mois
          const existingMonth = monthMap.get(month) || { amount: 0, savings: 0 };
          monthMap.set(month, {
            amount: existingMonth.amount + amount,
            savings: existingMonth.savings + savings
          });
        } else {
          nonEligibleAmount += amount;
        }
      });

      const taxCreditAmount = eligibleAmount * 0.5;

      setSavingsData({
        totalSpent,
        taxCreditAmount,
        eligibleAmount,
        nonEligibleAmount,
        byCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          amount: data.amount,
          savings: data.savings
        })),
        byMonth: Array.from(monthMap.entries()).map(([month, data]) => ({
          month,
          amount: data.amount,
          savings: data.savings
        })),
        yearToDate: taxCreditAmount
      });
    } catch (error) {
      console.error('Erreur chargement économies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Plafond annuel crédit d'impôt (12 000€ pour le crédit, soit 24 000€ de dépenses)
  const annualCap = 12000;
  const progressPercentage = Math.min((savingsData.taxCreditAmount / annualCap) * 100, 100);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <PiggyBank className="h-6 w-6 text-green-600" />
                Mes économies {year}
              </CardTitle>
              <CardDescription>
                Crédit d'impôt de 50% sur les services à la personne
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {[year - 1, year].map((y) => (
                <Badge
                  key={y}
                  variant={y === year ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setYear(y)}
                >
                  {y}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total économisé */}
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Crédit d'impôt</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(savingsData.taxCreditAmount)}</p>
              <p className="text-sm opacity-75 mt-1">économisés cette année</p>
            </div>

            {/* Total dépensé */}
            <div className="rounded-xl bg-card border p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total dépensé</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(savingsData.totalSpent)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                dont {formatCurrency(savingsData.eligibleAmount)} éligibles
              </p>
            </div>

            {/* Progression plafond */}
            <div className="rounded-xl bg-card border p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Plafond annuel</span>
              </div>
              <Progress value={progressPercentage} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                {formatCurrency(savingsData.taxCreditAmount)} / {formatCurrency(annualCap)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails par onglets */}
      <Tabs defaultValue="category" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="category" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Par catégorie
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Par mois
          </TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Économies par catégorie de service</CardTitle>
            </CardHeader>
            <CardContent>
              {savingsData.byCategory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune donnée pour cette période</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savingsData.byCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-muted-foreground">
                          Dépensé: {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          -{formatCurrency(item.savings)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Économies par mois</CardTitle>
            </CardHeader>
            <CardContent>
              {savingsData.byMonth.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune donnée pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savingsData.byMonth.map((item) => (
                    <div key={item.month} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{item.month}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)} dépensés</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">-{formatCurrency(item.savings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info crédit d'impôt */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">À propos du crédit d'impôt</p>
            <p className="text-blue-700">
              Les services à la personne (ménage, garde d'enfants, aide aux seniors...) 
              bénéficient d'un crédit d'impôt de 50%, dans la limite de 12 000€ par an. 
              Les services Bika Travel, Bika Pro et Bika Plus ne sont pas éligibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
