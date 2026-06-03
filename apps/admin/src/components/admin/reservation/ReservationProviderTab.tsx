import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Reservation } from "./types";

interface Props {
  reservation: Reservation;
  availableProviders: any[];
  selectedProvider: string;
  setSelectedProvider: (v: string) => void;
  isLoading: boolean;
  handleAssignProvider: () => Promise<void>;
}

export function ReservationProviderTab({
  reservation, availableProviders, selectedProvider, setSelectedProvider, isLoading, handleAssignProvider,
}: Props) {
  return (
    <TabsContent value="provider" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assignation prestataire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reservation.provider_profile ? (
            <div>
              <Label className="text-muted-foreground">Prestataire assigné</Label>
              <p className="font-medium">
                {reservation.provider_profile.first_name} {reservation.provider_profile.last_name}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Sélectionner un prestataire</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un prestataire..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.profiles?.first_name} {provider.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignProvider}
                disabled={isLoading || !selectedProvider}
                className="w-full"
              >
                Assigner ce prestataire
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
