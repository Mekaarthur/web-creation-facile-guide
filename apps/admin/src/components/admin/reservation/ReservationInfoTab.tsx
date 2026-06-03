import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, Mail, FileText } from "lucide-react";
import { Reservation, Financials } from "./types";

interface Props {
  reservation: Reservation;
  financials: Financials;
}

export function ReservationInfoTab({ reservation, financials }: Props) {
  return (
    <TabsContent value="info" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informations générales</span>
            <Badge>{reservation.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Service</Label>
              <p className="font-medium">{reservation.services?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{reservation.services?.category || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <p className="font-medium">
                  {new Date(reservation.booking_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Horaires</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <p className="font-medium">
                  {reservation.start_time} - {reservation.end_time}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Durée</Label>
              <p className="font-medium">{financials.duration}h</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prix horaire client</Label>
              <p className="font-medium">{financials.hourlyRate.toFixed(2)}€/h</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Adresse</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <p className="font-medium">{reservation.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="font-medium">
              {reservation.client_profile?.first_name || ''} {reservation.client_profile?.last_name || ''}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${reservation.client_profile?.email}`} className="text-primary hover:underline">
                {reservation.client_profile?.email || 'N/A'}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {reservation.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes du client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{reservation.notes}</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
