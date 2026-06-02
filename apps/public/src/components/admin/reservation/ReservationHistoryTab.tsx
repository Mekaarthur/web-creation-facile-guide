import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { History } from "lucide-react";

interface Props {
  clientHistory: any[];
}

export function ReservationHistoryTab({ clientHistory }: Props) {
  return (
    <TabsContent value="history" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique du client
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientHistory.length > 0 ? (
            <div className="space-y-3">
              {clientHistory.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.services?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString('fr-FR')} à {booking.start_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{booking.status}</Badge>
                    <p className="text-sm font-medium mt-1">{booking.total_price.toFixed(2)}€</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun historique trouvé pour ce client
            </p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
