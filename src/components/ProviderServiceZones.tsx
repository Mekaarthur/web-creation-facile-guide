import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin,
  Car,
  Clock,
  Euro,
  Search,
  Save,
  AlertCircle,
  CheckCircle,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Zone {
  code: string;
  name: string;
  type: 'department' | 'arrondissement' | 'commune';
  parent?: string;
}

const parisArrondissements: Zone[] = Array.from({ length: 20 }, (_, i) => ({
  code: `75${String(i + 1).padStart(3, '0')}`,
  name: `${i + 1}${i === 0 ? 'er' : 'ème'} arrondissement`,
  type: 'arrondissement',
  parent: '75'
}));

const departments = [
  { code: '75', name: 'Paris', zones: parisArrondissements },
  { code: '77', name: 'Seine-et-Marne', zones: [
    { code: '77001', name: 'Meaux', type: 'commune' as const, parent: '77' },
    { code: '77002', name: 'Melun', type: 'commune' as const, parent: '77' },
    { code: '77003', name: 'Chelles', type: 'commune' as const, parent: '77' },
    { code: '77004', name: 'Pontault-Combault', type: 'commune' as const, parent: '77' },
    { code: '77005', name: 'Savigny-le-Temple', type: 'commune' as const, parent: '77' },
    { code: '77006', name: 'Champs-sur-Marne', type: 'commune' as const, parent: '77' },
    { code: '77007', name: 'Lagny-sur-Marne', type: 'commune' as const, parent: '77' },
    { code: '77008', name: 'Torcy', type: 'commune' as const, parent: '77' }
  ]},
  { code: '78', name: 'Yvelines', zones: [
    { code: '78001', name: 'Versailles', type: 'commune' as const, parent: '78' },
    { code: '78002', name: 'Saint-Germain-en-Laye', type: 'commune' as const, parent: '78' },
    { code: '78003', name: 'Poissy', type: 'commune' as const, parent: '78' },
    { code: '78004', name: 'Sartrouville', type: 'commune' as const, parent: '78' },
    { code: '78005', name: 'Conflans-Sainte-Honorine', type: 'commune' as const, parent: '78' },
    { code: '78006', name: 'Houilles', type: 'commune' as const, parent: '78' },
    { code: '78007', name: 'Plaisir', type: 'commune' as const, parent: '78' },
    { code: '78008', name: 'Les Mureaux', type: 'commune' as const, parent: '78' }
  ]},
  { code: '91', name: 'Essonne', zones: [
    { code: '91001', name: 'Évry-Courcouronnes', type: 'commune' as const, parent: '91' },
    { code: '91002', name: 'Corbeil-Essonnes', type: 'commune' as const, parent: '91' },
    { code: '91003', name: 'Palaiseau', type: 'commune' as const, parent: '91' },
    { code: '91004', name: 'Massy', type: 'commune' as const, parent: '91' },
    { code: '91005', name: 'Savigny-sur-Orge', type: 'commune' as const, parent: '91' },
    { code: '91006', name: 'Athis-Mons', type: 'commune' as const, parent: '91' },
    { code: '91007', name: 'Yerres', type: 'commune' as const, parent: '91' },
    { code: '91008', name: 'Draveil', type: 'commune' as const, parent: '91' }
  ]},
  { code: '92', name: 'Hauts-de-Seine', zones: [
    { code: '92001', name: 'Boulogne-Billancourt', type: 'commune' as const, parent: '92' },
    { code: '92002', name: 'Neuilly-sur-Seine', type: 'commune' as const, parent: '92' },
    { code: '92003', name: 'Courbevoie', type: 'commune' as const, parent: '92' },
    { code: '92004', name: 'Levallois-Perret', type: 'commune' as const, parent: '92' },
    { code: '92005', name: 'Issy-les-Moulineaux', type: 'commune' as const, parent: '92' },
    { code: '92006', name: 'Puteaux', type: 'commune' as const, parent: '92' },
    { code: '92007', name: 'Rueil-Malmaison', type: 'commune' as const, parent: '92' },
    { code: '92008', name: 'Colombes', type: 'commune' as const, parent: '92' }
  ]},
  { code: '93', name: 'Seine-Saint-Denis', zones: [
    { code: '93001', name: 'Saint-Denis', type: 'commune' as const, parent: '93' },
    { code: '93002', name: 'Montreuil', type: 'commune' as const, parent: '93' },
    { code: '93003', name: 'Bobigny', type: 'commune' as const, parent: '93' },
    { code: '93004', name: 'Aulnay-sous-Bois', type: 'commune' as const, parent: '93' },
    { code: '93005', name: 'Aubervilliers', type: 'commune' as const, parent: '93' },
    { code: '93006', name: 'Drancy', type: 'commune' as const, parent: '93' },
    { code: '93007', name: 'Noisy-le-Grand', type: 'commune' as const, parent: '93' },
    { code: '93008', name: 'Pantin', type: 'commune' as const, parent: '93' }
  ]},
  { code: '94', name: 'Val-de-Marne', zones: [
    { code: '94001', name: 'Créteil', type: 'commune' as const, parent: '94' },
    { code: '94002', name: 'Vincennes', type: 'commune' as const, parent: '94' },
    { code: '94003', name: 'Fontenay-sous-Bois', type: 'commune' as const, parent: '94' },
    { code: '94004', name: 'Maisons-Alfort', type: 'commune' as const, parent: '94' },
    { code: '94005', name: 'Saint-Maur-des-Fossés', type: 'commune' as const, parent: '94' },
    { code: '94006', name: 'Champigny-sur-Marne', type: 'commune' as const, parent: '94' },
    { code: '94007', name: 'Vitry-sur-Seine', type: 'commune' as const, parent: '94' },
    { code: '94008', name: 'Ivry-sur-Seine', type: 'commune' as const, parent: '94' }
  ]},
  { code: '95', name: 'Val-d\'Oise', zones: [
    { code: '95001', name: 'Cergy', type: 'commune' as const, parent: '95' },
    { code: '95002', name: 'Argenteuil', type: 'commune' as const, parent: '95' },
    { code: '95003', name: 'Sarcelles', type: 'commune' as const, parent: '95' },
    { code: '95004', name: 'Garges-lès-Gonesse', type: 'commune' as const, parent: '95' },
    { code: '95005', name: 'Franconville', type: 'commune' as const, parent: '95' },
    { code: '95006', name: 'Goussainville', type: 'commune' as const, parent: '95' },
    { code: '95007', name: 'Pontoise', type: 'commune' as const, parent: '95' },
    { code: '95008', name: 'Ermont', type: 'commune' as const, parent: '95' }
  ]}
];

const ProviderServiceZones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [travelCost, setTravelCost] = useState<number>(2);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('75');

  useEffect(() => {
    if (user) {
      loadProviderZones();
    }
  }, [user]);

  const loadProviderZones = async () => {
    try {
      // Get provider data
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);
        setSelectedZones(providerData.postal_codes || []);
        setMaxDistance(providerData.work_radius || 20);
      }
    } catch (error) {
      console.error('Error loading provider zones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les zones d'intervention",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = (zoneCode: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneCode) 
        ? prev.filter(code => code !== zoneCode)
        : [...prev, zoneCode]
    );
  };

  const toggleDepartment = (departmentCode: string) => {
    const department = departments.find(d => d.code === departmentCode);
    if (!department) return;

    const allZoneCodes = department.zones.map(z => z.code);
    const isFullySelected = allZoneCodes.every(code => selectedZones.includes(code));

    if (isFullySelected) {
      // Deselect all zones in this department
      setSelectedZones(prev => prev.filter(code => !allZoneCodes.includes(code)));
    } else {
      // Select all zones in this department
      setSelectedZones(prev => {
        const newZones = [...prev];
        allZoneCodes.forEach(code => {
          if (!newZones.includes(code)) {
            newZones.push(code);
          }
        });
        return newZones;
      });
    }
  };

  const saveZones = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          postal_codes: selectedZones,
          work_radius: maxDistance,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast({
        title: "Zones d'intervention mises à jour",
        description: `${selectedZones.length} zones sélectionnées`,
      });
    } catch (error) {
      console.error('Error saving zones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les zones",
        variant: "destructive",
      });
    }
  };

  const filteredDepartments = departments.filter(dept => 
    searchTerm === '' ||
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.zones.some(zone => 
      zone.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getSelectedCount = (departmentCode: string) => {
    const department = departments.find(d => d.code === departmentCode);
    if (!department) return 0;
    
    return department.zones.filter(zone => selectedZones.includes(zone.code)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Zones d'Intervention
          </h2>
          <p className="text-muted-foreground">
            Définissez où vous souhaitez intervenir en Île-de-France
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <MapPin className="h-3 w-3 mr-1" />
            {selectedZones.length} zones sélectionnées
          </Badge>
          <Button onClick={saveZones} className="bg-gradient-to-r from-primary to-secondary">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Paramètres de déplacement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxDistance">Distance maximale (km)</Label>
              <Input
                id="maxDistance"
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                min="5"
                max="50"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Distance maximale pour vous déplacer depuis votre domicile
              </p>
            </div>
            
            <div>
              <Label htmlFor="travelCost">Coût kilométrique (€/km)</Label>
              <Input
                id="travelCost"
                type="number"
                value={travelCost}
                onChange={(e) => setTravelCost(Number(e.target.value))}
                min="0"
                max="10"
                step="0.1"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Coût ajouté pour les déplacements (optionnel)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estimation des trajets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Paris centre ↔ Banlieue proche:</span>
                <Badge variant="outline">15-30 min</Badge>
              </div>
              <div className="flex justify-between">
                <span>Banlieue ↔ Grande couronne:</span>
                <Badge variant="outline">30-45 min</Badge>
              </div>
              <div className="flex justify-between">
                <span>Traversée complète IDF:</span>
                <Badge variant="outline">45-90 min</Badge>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Plus vous couvrez de zones, plus vous recevrez d'opportunités !
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un département ou une ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Department tabs */}
      <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
        <TabsList className="bg-white shadow-sm border w-full">
          {departments.map((dept) => (
            <TabsTrigger 
              key={dept.code} 
              value={dept.code}
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
            >
              {dept.code} - {dept.name}
              {getSelectedCount(dept.code) > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 text-xs">
                  {getSelectedCount(dept.code)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {departments.map((department) => (
          <TabsContent key={department.code} value={department.code} className="space-y-4">
            {/* Department header */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{department.name} ({department.code})</h3>
                      <p className="text-sm text-muted-foreground">
                        {department.zones.length} {department.code === '75' ? 'arrondissements' : 'communes principales'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => toggleDepartment(department.code)}
                    className={cn(
                      "transition-all",
                      getSelectedCount(department.code) === department.zones.length
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                        : "hover:bg-primary/10"
                    )}
                  >
                    {getSelectedCount(department.code) === department.zones.length ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tout désélectionner
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Tout sélectionner
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zones grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {department.zones.map((zone) => {
                const isSelected = selectedZones.includes(zone.code);
                
                return (
                  <Card 
                    key={zone.code}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg border-2",
                      isSelected 
                        ? "border-green-200 bg-green-50 shadow-md" 
                        : "border-gray-100 hover:border-primary/20"
                    )}
                    onClick={() => toggleZone(zone.code)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{zone.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {zone.type === 'arrondissement' ? 'Arrondissement' : 'Commune'} - {zone.code}
                          </p>
                        </div>
                        
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected 
                            ? "border-green-500 bg-green-500" 
                            : "border-gray-300"
                        )}>
                          {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Récapitulatif de vos zones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Zones sélectionnées:</span> {selectedZones.length}</p>
                  <p><span className="font-medium">Distance max:</span> {maxDistance} km</p>
                </div>
                <div>
                  <p><span className="font-medium">Départements couverts:</span> {
                    [...new Set(selectedZones.map(code => code.substring(0, 2)))].length
                  }</p>
                  <p className="text-green-600">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Configuration optimale pour recevoir des missions !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderServiceZones;