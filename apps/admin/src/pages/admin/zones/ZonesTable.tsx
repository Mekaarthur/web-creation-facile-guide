import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, Trash2, CheckCircle, MapPinOff, Users, UserPlus, Filter } from "lucide-react";
import { Star } from "lucide-react";
import { GeographicZone } from "./types";

interface Props {
  filteredZones: GeographicZone[];
  getTypeIcon: (type: string) => JSX.Element;
  getTypeBadge: (type: string) => JSX.Element;
  handleEdit: (zone: GeographicZone) => void;
  handleAssignProviders: (zone: GeographicZone) => void;
  toggleZoneStatus: (zoneId: string) => void;
  handleDeleteZone: (zoneId: string, zoneName: string) => void;
}

export function ZonesTable({
  filteredZones, getTypeIcon, getTypeBadge, handleEdit, handleAssignProviders, toggleZoneStatus, handleDeleteZone,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zones Configurées ({filteredZones.length})</CardTitle>
        <CardDescription>
          Gérez les zones géographiques où vos services sont disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom de la zone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Villes couvertes</TableHead>
              <TableHead className="text-center">Prestataires</TableHead>
              <TableHead className="text-center">Clients</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <MapPinOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune zone trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone, index) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(zone.type_zone)}
                      <div>
                        <div className="font-medium">{zone.nom_zone}</div>
                        <div className="text-xs text-muted-foreground">
                          {zone.codes_postaux.length} code{zone.codes_postaux.length > 1 ? 's' : ''} postal{zone.codes_postaux.length > 1 ? 'aux' : ''}
                          {zone.rayon_km && ` • ${zone.rayon_km}km`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(zone.type_zone)}</TableCell>
                  <TableCell>
                    {zone.villes_couvertes && zone.villes_couvertes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {zone.villes_couvertes.slice(0, 3).map((ville, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{ville}</Badge>
                        ))}
                        {zone.villes_couvertes.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{zone.villes_couvertes.length - 3}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="secondary" className="font-semibold">
                        <Users className="w-3 h-3 mr-1" />
                        {zone.provider_count || 0}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleAssignProviders(zone)}>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Gérer
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{zone.client_count || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={zone.statut === 'active' ? "default" : zone.statut === 'test' ? "secondary" : "destructive"}
                        className="w-fit"
                      >
                        {zone.statut === 'active' && '✅ Active'}
                        {zone.statut === 'test' && '🟡 Test'}
                        {zone.statut === 'inactive' && '❌ Inactive'}
                      </Badge>
                      {zone.satisfaction_moyenne && zone.satisfaction_moyenne > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span>{zone.satisfaction_moyenne.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(zone)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignProviders(zone)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assigner prestataires
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleZoneStatus(zone.id)}>
                          {zone.active ? (
                            <><MapPinOff className="w-4 h-4 mr-2" />Désactiver</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" />Activer</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteZone(zone.id, zone.nom_zone)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
