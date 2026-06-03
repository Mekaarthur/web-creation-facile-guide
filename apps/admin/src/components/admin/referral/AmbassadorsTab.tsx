import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SuperAmbassador } from './types';

interface Props {
  ambassadors: SuperAmbassador[];
  totalAmbassadors: number;
  removeAmbassadorBadge: (id: string) => void;
}

export function AmbassadorsTab({ ambassadors, totalAmbassadors, removeAmbassadorBadge }: Props) {
  return (
    <TabsContent value="ambassadors" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Super Ambassadeurs
          </CardTitle>
          <CardDescription>
            {totalAmbassadors} ambassadeur{totalAmbassadors > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ambassadors.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun Super Ambassadeur pour le moment</p>
              </div>
            ) : (
              ambassadors.map(ambassador => (
                <div key={ambassador.id} className="border rounded-lg p-4 bg-gradient-to-r from-warning/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
                        <Star className="h-6 w-6 text-warning-foreground fill-warning-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">
                          {ambassador.profiles?.first_name} {ambassador.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{ambassador.business_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Badge obtenu le {format(new Date(ambassador.ambassador_badge_earned_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-warning">{ambassador.yearly_referrals_count}</p>
                      <p className="text-sm text-muted-foreground">Filleuls validés</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => removeAmbassadorBadge(ambassador.id)}
                      >
                        Retirer le badge
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
