import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminProviderZonesProps {
  providerId: string;
}

interface DepartmentData {
  name: string;
  arrondissements?: string[];
  communes?: string[];
}

const DEPARTMENTS: Record<string, DepartmentData> = {
  '75': { name: 'Paris', arrondissements: Array.from({length: 20}, (_, i) => `75${(i + 1).toString().padStart(3, '0')}`) },
  '77': { name: 'Seine-et-Marne', communes: ['Meaux', 'Melun', 'Chelles', 'Pontault-Combault', 'Savigny-le-Temple', 'Champs-sur-Marne', 'Villeparisis', 'Torcy', 'Roissy-en-Brie', 'Combs-la-Ville'] },
  '78': { name: 'Yvelines', communes: ['Versailles', 'Sartrouville', 'Mantes-la-Jolie', 'Saint-Germain-en-Laye', 'Poissy', 'Conflans-Sainte-Honorine', 'Les Mureaux', 'Plaisir', 'Chatou', 'Le Chesnay-Rocquencourt'] },
  '91': { name: 'Essonne', communes: ['Évry-Courcouronnes', 'Corbeil-Essonnes', 'Massy', 'Savigny-sur-Orge', 'Sainte-Geneviève-des-Bois', 'Viry-Châtillon', 'Athis-Mons', 'Palaiseau', 'Draveil', 'Yerres'] },
  '92': { name: 'Hauts-de-Seine', communes: ['Boulogne-Billancourt', 'Nanterre', 'Courbevoie', 'Asnières-sur-Seine', 'Colombes', 'Rueil-Malmaison', 'Clichy', 'Levallois-Perret', 'Issy-les-Moulineaux', 'Antony'] },
  '93': { name: 'Seine-Saint-Denis', communes: ['Saint-Denis', 'Montreuil', 'Aubervilliers', 'Aulnay-sous-Bois', 'Drancy', 'Noisy-le-Grand', 'Pantin', 'Bondy', 'Épinay-sur-Seine', 'Sevran'] },
  '94': { name: 'Val-de-Marne', communes: ['Créteil', 'Vitry-sur-Seine', 'Saint-Maur-des-Fossés', 'Champigny-sur-Marne', 'Ivry-sur-Seine', 'Maisons-Alfort', 'Fontenay-sous-Bois', 'Vincennes', 'Alfortville', 'Villejuif'] },
  '95': { name: 'Val-d\'Oise', communes: ['Argenteuil', 'Cergy', 'Garges-lès-Gonesse', 'Franconville', 'Goussainville', 'Pontoise', 'Bezons', 'Villiers-le-Bel', 'Gonesse', 'Taverny'] }
};

const AdminProviderZones = ({ providerId }: AdminProviderZonesProps) => {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProviderZones = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('providers')
        .select('service_zones, postal_codes, location, work_radius')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      
      setProvider(data);
      setSelectedZones(data?.service_zones || []);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les zones d'intervention",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveZones = async () => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ 
          service_zones: selectedZones,
          postal_codes: selectedZones.filter(zone => zone.match(/^\d{5}$/))
        })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Zones mises à jour",
        description: "Les zones d'intervention ont été enregistrées",
      });

      setIsEditing(false);
      setIsDialogOpen(false);
      loadProviderZones();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les zones",
        variant: "destructive"
      });
    }
  };

  const handleToggleZone = (zone: string) => {
    if (selectedZones.includes(zone)) {
      setSelectedZones(selectedZones.filter(z => z !== zone));
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
  };

  const handleToggleDepartment = (deptCode: string) => {
    const dept = DEPARTMENTS[deptCode as keyof typeof DEPARTMENTS];
    const deptZones = dept.arrondissements || dept.communes || [];
    
    const allSelected = deptZones.every(zone => selectedZones.includes(zone));
    
    if (allSelected) {
      // Tout désélectionner
      setSelectedZones(selectedZones.filter(zone => !deptZones.includes(zone)));
    } else {
      // Tout sélectionner
      const newZones = [...selectedZones];
      deptZones.forEach(zone => {
        if (!newZones.includes(zone)) {
          newZones.push(zone);
        }
      });
      setSelectedZones(newZones);
    }
  };

  useEffect(() => {
    loadProviderZones();
  }, [providerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Zones d'intervention</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Modifier les zones
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier les zones d'intervention</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {Object.entries(DEPARTMENTS).map(([deptCode, dept]) => {
                const zones = dept.arrondissements || dept.communes || [];
                const selectedCount = zones.filter(zone => selectedZones.includes(zone)).length;
                const allSelected = selectedCount === zones.length;
                
                return (
                  <Card key={deptCode}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {dept.name} ({deptCode})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {selectedCount}/{zones.length} sélectionnés
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleDepartment(deptCode)}
                          >
                            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {zones.map(zone => (
                          <div key={zone} className="flex items-center space-x-2">
                            <Checkbox
                              id={zone}
                              checked={selectedZones.includes(zone)}
                              onCheckedChange={() => handleToggleZone(zone)}
                            />
                            <Label htmlFor={zone} className="text-sm cursor-pointer">
                              {deptCode === '75' ? `${zone.slice(-2)}ème` : zone}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveZones}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Zones actuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provider?.service_zones && provider.service_zones.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(DEPARTMENTS).map(([deptCode, dept]) => {
                const zones = dept.arrondissements || dept.communes || [];
                const selectedInDept = provider.service_zones.filter((zone: string) => zones.includes(zone));
                
                if (selectedInDept.length === 0) return null;
                
                return (
                  <div key={deptCode}>
                    <h4 className="font-medium mb-2">{dept.name} ({deptCode})</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedInDept.map((zone: string) => (
                        <Badge key={zone} variant="secondary" className="text-xs">
                          {deptCode === '75' ? `${zone.slice(-2)}ème` : zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 p-3 bg-muted rounded">
                <p className="text-sm">
                  <strong>Total:</strong> {provider.service_zones.length} zone(s) d'intervention
                </p>
                {provider.work_radius && (
                  <p className="text-sm text-muted-foreground">
                    Rayon d'action: {provider.work_radius} km
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune zone d'intervention configurée</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProviderZones;