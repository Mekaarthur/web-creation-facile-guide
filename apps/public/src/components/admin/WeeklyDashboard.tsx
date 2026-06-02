import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Star, RefreshCw, Users, Euro, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import {
  useWeeklyCompletedBookings,
  useWeeklyAvgRating,
  useRecurringClientsRate,
  useActiveProvidersRatio,
  useAcquisitionCostByChannel,
} from "@/hooks/useWeeklyKPIs";

const getStatusColor = (status: 'green' | 'amber' | 'red' | 'gray') => {
  const map = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-muted-foreground/40' };
  return map[status];
};

const TrendIndicator = ({ current, previous, suffix = '' }: { current: number; previous: number | null; suffix?: string }) => {
  if (previous === null || previous === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  const diff = current - previous;
  if (diff > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{diff}{suffix}</span>;
  if (diff < 0) return <span className="text-xs text-red-600 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{diff}{suffix}</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" />stable</span>;
};

export const WeeklyDashboard = () => {
  const { data: bookings, isLoading: l1 } = useWeeklyCompletedBookings();
  const { data: rating, isLoading: l2 } = useWeeklyAvgRating();
  const { data: recurring, isLoading: l3 } = useRecurringClientsRate();
  const { data: providers, isLoading: l4 } = useActiveProvidersRatio();
  const { data: acquisition, isLoading: l5 } = useAcquisitionCostByChannel();

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const ratingStatus = !rating ? 'gray' : rating.avg_rating >= 4.5 ? 'green' : rating.avg_rating >= 4.0 ? 'amber' : 'red';
  const recurringStatus = !recurring ? 'gray' : recurring.rate >= 30 ? 'green' : recurring.rate >= 20 ? 'amber' : 'red';
  const providerStatus = !providers ? 'gray' : providers.rate >= 80 ? 'green' : providers.rate >= 60 ? 'amber' : 'red';

  const bestChannel = acquisition?.length ? acquisition[0] : null;
  const cacStatus = !bestChannel ? 'gray' : bestChannel.cac <= 10 ? 'green' : bestChannel.cac <= 25 ? 'amber' : 'red';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chargement des KPIs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Badge className="bg-primary text-primary-foreground text-xs">BIKAWÔ</Badge>
          <h2 className="text-xl font-semibold">Tableau de bord hebdomadaire</h2>
        </div>
        <p className="text-sm text-muted-foreground">5 indicateurs — à consulter chaque lundi matin</p>
      </div>

      {rating && rating.avg_rating > 0 && rating.avg_rating < 4.0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-800 dark:text-red-200">
          ⚠️ Alerte qualité : note {rating.avg_rating}/5 — Arrêtez l'acquisition de nouveaux clients et corrigez la qualité en priorité.
        </div>
      )}

      {rating && rating.avg_rating >= 4.0 && rating.avg_rating < 4.5 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ Vigilance : note {rating.avg_rating}/5 — Objectif 4,5/5. Identifiez les causes d'insatisfaction cette semaine.
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* KPI 1 - Prestations */}
        <Card className="relative">
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${bookings && bookings.count >= 30 ? 'bg-green-500' : bookings && bookings.count >= 10 ? 'bg-amber-500' : 'bg-muted-foreground/40'}`} />
          <CardHeader className="pb-2">
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{bookings?.count ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Prestations réalisées</p>
            <div className="mt-2">
              <TrendIndicator current={bookings?.count ?? 0} previous={bookings?.previous_count ?? null} suffix=" vs sem. préc." />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 - Note moyenne */}
        <Card className="relative">
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${getStatusColor(ratingStatus)}`} />
          <CardHeader className="pb-2">
            <Star className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{rating?.avg_rating ? `${rating.avg_rating}/5` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Note moyenne prestataires</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {rating?.avg_rating ? (rating.avg_rating >= 4.5 ? '✅ Objectif atteint' : rating.avg_rating >= 4.0 ? '⚠️ Vigilance requise' : '🛑 Arrêt acquisition') : '—'}
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 - Clients récurrents */}
        <Card className="relative">
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${getStatusColor(recurringStatus)}`} />
          <CardHeader className="pb-2">
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{recurring ? `${recurring.rate}%` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Taux de clients récurrents</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {recurring ? (recurring.rate >= 30 ? '🔄 Flywheel actif' : 'En dessous de l\'objectif') : '—'}
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 - Prestataires actifs */}
        <Card className="relative">
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${getStatusColor(providerStatus)}`} />
          <CardHeader className="pb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{providers ? `${providers.active}/${providers.total}` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Prestataires actifs / total</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {providers ? `${providers.rate}% actifs` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 - CAC */}
        <Card className="relative">
          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${getStatusColor(cacStatus)}`} />
          <CardHeader className="pb-2">
            <Euro className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{bestChannel ? `${bestChannel.cac}€` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">CAC moyen (meilleur canal)</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {bestChannel ? `${bestChannel.channel}` : 'Aucune donnée'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seuils de référence */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Seuils de référence</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Note ≥ 4,5/5</Badge>
          <Badge variant="outline" className="gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Récurrence ≥ 30%</Badge>
          <Badge variant="outline" className="gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Actifs/Total ≥ 80%</Badge>
          <Badge variant="outline" className="gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Note 4,0-4,4 → vigilance</Badge>
          <Badge variant="outline" className="gap-1.5 text-xs"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Note &lt; 4,0 → arrêt acq.</Badge>
        </div>
      </div>

      {/* Détail acquisition par canal */}
      {acquisition && acquisition.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Coût d'acquisition par canal (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acquisition.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ch.channel}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{ch.conversions} conv.</span>
                    <span className="font-medium">{ch.cac}€/client</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
