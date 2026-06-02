import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, Activity, Star, Award, CheckCircle, TrendingUp, TrendingDown, Clock, Zap, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ZoneAlerts } from '@/components/provider/ZoneAlerts';
import { getStatusColor, getStatusLabel } from '@/utils/statusUtils';

interface ProviderDashboardTabProps {
  stats: {
    monthlyEarnings: number;
    earningsGrowth: number;
    activeMissions: number;
    averageRating: number;
    completedMissions: number;
  };
  opportunities: any[];
  missions: any[];
  applyToMission: (id: string) => void;
}

const motivationalQuotes = [
  "Chaque mission est une nouvelle opportunité de briller ! ✨",
  "Votre talent fait la différence dans la vie de vos clients 🌟",
  "Aujourd'hui est parfait pour dépasser vos objectifs ! 🚀",
  "L'excellence n'est pas un acte, mais une habitude 💎"
];

const ProviderDashboardTab = ({ stats, opportunities, missions, applyToMission }: ProviderDashboardTabProps) => {
  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Citation motivante */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent"></div>
        <CardContent className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground mb-1 sm:mb-2">Motivation du jour</p>
              <p className="text-muted-foreground italic text-xs sm:text-base lg:text-lg">{todayQuote}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Ce mois</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyEarnings)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <div className={`flex items-center gap-1 ${stats.earningsGrowth >= 0 ? 'text-success' : 'text-destructive'} text-xs sm:text-sm font-medium`}>
                {stats.earningsGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stats.earningsGrowth >= 0 ? '+' : ''}{stats.earningsGrowth}%
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Missions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.activeMissions}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 text-blue-600 text-xs sm:text-sm font-medium">
                <Clock className="h-3 w-3" />
                À traiter
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"></div>
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Note</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(stats.averageRating) ? 'fill-warning text-warning' : 'text-muted-foreground/40'}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
          <CardContent className="relative p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats.completedMissions}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 text-purple-600 text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3" />
                Réalisées
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunités et missions récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Opportunités récentes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Postes disponibles correspondant à vos services</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {opportunities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 sm:py-6 text-sm">Aucune opportunité disponible pour le moment.</p>
            ) : (
              <ul className="space-y-3 sm:space-y-4">
                {opportunities.map(opportunity => (
                  <li key={opportunity.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-lg truncate">{opportunity.services?.name || 'Service non spécifié'}</h3>
                          {opportunity.match_score && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 flex-shrink-0">
                              Score: {opportunity.match_score}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{format(new Date(opportunity.booking_date), 'PPP', { locale: fr })} - {opportunity.start_time}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{opportunity.address}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                        <p className="font-bold text-primary text-sm sm:text-base">{formatCurrency(opportunity.total_price)}</p>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${opportunity.source === 'matching' ? 'text-secondary border-secondary/30' : 'text-blue-600'}`}>
                          {opportunity.source === 'matching' ? '⚡ Recommandé' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 sm:mt-3 w-full text-xs sm:text-sm"
                      onClick={() => applyToMission(opportunity.id)}
                    >
                      Postuler
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Missions récentes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Suivi de vos missions récentes</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {missions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 sm:py-6 text-sm">Vous n'avez pas encore de missions.</p>
            ) : (
              <ul className="space-y-3 sm:space-y-4">
                {missions.slice(0, 5).map(mission => (
                  <li key={mission.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-lg truncate">{mission.services?.name || 'Service non spécifié'}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{format(new Date(mission.booking_date), 'PPP', { locale: fr })} - {mission.start_time} à {mission.end_time}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{mission.address}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                        <p className="font-bold text-primary text-sm sm:text-base">{formatCurrency(mission.total_price)}</p>
                        <Badge className={`${getStatusColor(mission.status)} text-[10px] sm:text-xs`}>{getStatusLabel(mission.status)}</Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zone Alerts */}
      <ZoneAlerts />
    </div>
  );
};

export default ProviderDashboardTab;
