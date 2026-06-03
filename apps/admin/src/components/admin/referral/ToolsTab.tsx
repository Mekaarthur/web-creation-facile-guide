import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, FileSpreadsheet } from 'lucide-react';
import { ReferralStats } from './types';

interface Props {
  stats: ReferralStats;
  exportToCSV: () => void;
  recalculateRewards: () => Promise<void>;
}

export function ToolsTab({ stats, exportToCSV, recalculateRewards }: Props) {
  return (
    <TabsContent value="tools" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Comptable</CardTitle>
            <CardDescription>Téléchargez les données pour la comptabilité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportToCSV} className="w-full gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exporter en CSV
            </Button>
            <Button onClick={recalculateRewards} className="w-full gap-2" variant="outline">
              <TrendingUp className="h-4 w-4" />
              Recalculer les récompenses
            </Button>
            <p className="text-sm text-muted-foreground">
              Export complet de toutes les récompenses avec dates, montants et statuts.
              Le recalcul génère les récompenses manquantes en analysant l'historique.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques Globales</CardTitle>
            <CardDescription>Vue d'ensemble du programme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux de validation</span>
                <span className="font-bold">
                  {stats.totalReferrals > 0
                    ? Math.round((stats.validatedReferrals / stats.totalReferrals) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux de fidélisation</span>
                <span className="font-bold">
                  {stats.totalReferrals > 0
                    ? Math.round((stats.loyaltyReferrals / stats.totalReferrals) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coût moyen par filleul</span>
                <span className="font-bold">
                  {stats.activeReferrals > 0
                    ? Math.round(stats.paidAmount / stats.activeReferrals)
                    : 0}€
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
