import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Referral } from './types';

interface Props {
  referrals: Referral[];
  totalReferrals: number;
}

export function ReferralsTab({ referrals, totalReferrals }: Props) {
  return (
    <TabsContent value="referrals" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Liste des Parrainages</CardTitle>
          <CardDescription>
            {totalReferrals} parrainages au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun parrainage pour le moment</p>
              </div>
            ) : (
              referrals.map(referral => (
                <div key={referral.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {referral.referrer?.profiles?.first_name} {referral.referrer?.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {referral.referrer?.business_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Code</p>
                      <p className="font-mono font-bold">{referral.referral_code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Filleul</p>
                      <p className="font-medium">{referral.referred?.business_name || 'En attente'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Heures</p>
                      <p className="font-medium">{referral.hours_completed?.toFixed(1) || 0}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <div className="flex gap-2">
                        {referral.first_reward_paid && (
                          <Badge className="bg-info/10 text-info border-info/20">Validé</Badge>
                        )}
                        {referral.loyalty_bonus_paid && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Fidélisé</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span>{Math.min((referral.hours_completed / 120) * 100, 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((referral.hours_completed / 120) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Créé le {format(new Date(referral.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
