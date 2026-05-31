import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Building2, UserPlus } from "lucide-react";
import { GeographicZone } from "./types";

interface Props {
  showProviderDialog: boolean;
  setShowProviderDialog: (v: boolean) => void;
  selectedZoneForProviders: GeographicZone | null;
  availableProviders: any[];
  providerSearch: string;
  setProviderSearch: (v: string) => void;
  handleToggleProviderAssignment: (providerId: string) => void;
}

export function ProviderAssignmentDialog({
  showProviderDialog, setShowProviderDialog, selectedZoneForProviders,
  availableProviders, providerSearch, setProviderSearch, handleToggleProviderAssignment,
}: Props) {
  return (
    <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            Assigner des prestataires à : {selectedZoneForProviders?.nom_zone}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les prestataires à assigner à cette zone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un prestataire..."
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {availableProviders
              .filter(p =>
                providerSearch === '' ||
                p.business_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
                p.profiles?.first_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
                p.profiles?.last_name?.toLowerCase().includes(providerSearch.toLowerCase())
              )
              .map((provider) => (
                <Card key={provider.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {provider.business_name || `${provider.profiles?.first_name} ${provider.profiles?.last_name}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {provider.postal_codes?.length || 0} zone{(provider.postal_codes?.length || 0) > 1 ? 's' : ''} configurée{(provider.postal_codes?.length || 0) > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleToggleProviderAssignment(provider.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assigner
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowProviderDialog(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
