import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Globe,
  Map,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeographicZone {
  id: string;
  name: string;
  type: 'country' | 'region' | 'department' | 'city';
  code: string;
  parent_zone?: string;
  active: boolean;
  provider_count: number;
  request_count: number;
  description?: string;
  created_at: string;
}

const Zones = () => {
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GeographicZone | null>(null);
  const { toast } = useToast();

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setZones([
        {
          id: '1',
          name: 'France',
          type: 'country',
          code: 'FR',
          active: true,
          provider_count: 2156,
          request_count: 8420,
          description: 'Territoire français métropolitain',
          created_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Île-de-France',
          type: 'region',
          code: 'IDF',
          parent_zone: 'France',
          active: true,
          provider_count: 845,
          request_count: 3210,
          description: 'Région parisienne',
          created_at: '2024-01-01'
        },
        {
          id: '3',
          name: 'Paris',
          type: 'department',
          code: '75',
          parent_zone: 'Île-de-France',
          active: true,
          provider_count: 423,
          request_count: 1876,
          description: 'Département de Paris',
          created_at: '2024-01-01'
        },
        {
          id: '4',
          name: 'Lyon',
          type: 'city',
          code: '69000',
          parent_zone: 'Rhône-Alpes',
          active: true,
          provider_count: 187,
          request_count: 654,
          description: 'Ville de Lyon',
          created_at: '2024-01-01'
        },
        {
          id: '5',
          name: 'Marseille',
          type: 'city',
          code: '13000',
          parent_zone: 'PACA',
          active: false,
          provider_count: 156,
          request_count: 432,
          description: 'Ville de Marseille (temporairement désactivée)',
          created_at: '2024-01-01'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || zone.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'country': return <Globe className="w-4 h-4" />;
      case 'region': return <Map className="w-4 h-4" />;
      case 'department': return <MapPin className="w-4 h-4" />;
      case 'city': return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      country: 'default',
      region: 'secondary', 
      department: 'outline',
      city: 'destructive'
    };
    return <Badge variant={variants[type as keyof typeof variants] as any}>{type}</Badge>;
  };

  const handleSaveZone = () => {
    toast({
      title: "Zone sauvegardée",
      description: `La zone ${editingZone ? 'a été modifiée' : 'a été créée'} avec succès.`,
    });
    setIsDialogOpen(false);
    setEditingZone(null);
  };

  const handleDeleteZone = (zoneId: string, zoneName: string) => {
    setZones(zones.filter(zone => zone.id !== zoneId));
    toast({
      title: "Zone supprimée",
      description: `La zone "${zoneName}" a été supprimée avec succès.`,
    });
  };

  const toggleZoneStatus = (zoneId: string) => {
    setZones(zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, active: !zone.active }
        : zone
    ));
    const zone = zones.find(z => z.id === zoneId);
    toast({
      title: `Zone ${zone?.active ? 'désactivée' : 'activée'}`,
      description: `La zone "${zone?.name}" est maintenant ${zone?.active ? 'inactive' : 'active'}.`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zones Géographiques</h1>
            <p className="text-muted-foreground">Gestion des zones de couverture du service</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="w-full h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="w-full h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zones Géographiques</h1>
          <p className="text-muted-foreground">Gestion des zones de couverture du service</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingZone(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Modifier la zone' : 'Créer une nouvelle zone'}
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres de la zone géographique
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la zone</Label>
                  <Input
                    id="name"
                    placeholder="Paris"
                    defaultValue={editingZone?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="75000"
                    defaultValue={editingZone?.code}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type de zone</Label>
                <Select defaultValue={editingZone?.type || 'city'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="country">Pays</SelectItem>
                    <SelectItem value="region">Région</SelectItem>
                    <SelectItem value="department">Département</SelectItem>
                    <SelectItem value="city">Ville</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description de la zone..."
                  defaultValue={editingZone?.description}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveZone}>
                  {editingZone ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
            <Badge variant="secondary" className="mt-1">
              {zones.filter(z => z.active).length} actives
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prestataires Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum, zone) => sum + zone.provider_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Répartis sur toutes les zones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Demandes Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum, zone) => sum + zone.request_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur 30 derniers jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Zones Inactives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {zones.filter(z => !z.active).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type de zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="country">Pays</SelectItem>
            <SelectItem value="region">Régions</SelectItem>
            <SelectItem value="department">Départements</SelectItem>
            <SelectItem value="city">Villes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des zones */}
      <Card>
        <CardHeader>
          <CardTitle>Zones Configurées ({filteredZones.length})</CardTitle>
          <CardDescription>
            Gérez les zones géographiques où vos services sont disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getTypeIcon(zone.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{zone.name}</h3>
                      {getTypeBadge(zone.type)}
                      <Badge variant={zone.active ? "default" : "destructive"} className="text-xs">
                        {zone.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Code: {zone.code} | {zone.provider_count} prestataires | {zone.request_count} demandes
                    </p>
                    {zone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleZoneStatus(zone.id)}
                  >
                    {zone.active ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingZone(zone);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Zones;