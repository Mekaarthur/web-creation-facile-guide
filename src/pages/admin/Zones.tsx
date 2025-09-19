import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
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
  nom_zone: string;
  type_zone: 'departement' | 'ville' | 'secteur';
  codes_postaux: string[];
  rayon_km?: number;
  active: boolean;
  provider_count?: number;
  request_count?: number;
  created_at: string;
  updated_at: string;
}

const Zones = () => {
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GeographicZone | null>(null);
  const [formData, setFormData] = useState({
    nom_zone: '',
    codes_postaux: '',
    type_zone: 'departement',
    rayon_km: '',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-zones', {
        body: { action: 'list' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      // Calculer les statistiques des prestataires par zone (mock pour l'instant)
      const zonesWithStats = data.data.map((zone: any) => ({
        ...zone,
        provider_count: Math.floor(Math.random() * 200) + 50,
        request_count: Math.floor(Math.random() * 500) + 100
      }));
      
      setZones(zonesWithStats);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les zones géographiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.nom_zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.codes_postaux.some(code => code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || zone.type_zone === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'departement': return <Globe className="w-4 h-4" />;
      case 'ville': return <MapPin className="w-4 h-4" />;
      case 'secteur': return <Map className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      departement: 'default',
      ville: 'secondary', 
      secteur: 'outline'
    };
    return <Badge variant={variants[type as keyof typeof variants] as any}>{type}</Badge>;
  };

  const handleSaveZone = async () => {
    const codesPostaux = formData.codes_postaux
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    const zoneData = {
      nom_zone: formData.nom_zone,
      codes_postaux: codesPostaux,
      type_zone: formData.type_zone,
      rayon_km: formData.rayon_km ? parseInt(formData.rayon_km) : null,
      active: formData.active
    };

    try {
      const action = editingZone ? 'update' : 'create';
      const requestBody = editingZone 
        ? { action, zoneData, zoneId: editingZone.id }
        : { action, zoneData };

      const { data, error } = await supabase.functions.invoke('admin-zones', {
        body: requestBody
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      toast({
        title: editingZone ? "Zone modifiée" : "Zone créée",
        description: data.message
      });

      setIsDialogOpen(false);
      setEditingZone(null);
      setFormData({ nom_zone: '', codes_postaux: '', type_zone: 'departement', rayon_km: '', active: true });
      loadZones();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la zone géographique",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (zone: GeographicZone) => {
    setEditingZone(zone);
    setFormData({
      nom_zone: zone.nom_zone,
      codes_postaux: zone.codes_postaux.join(', '),
      type_zone: zone.type_zone,
      rayon_km: zone.rayon_km?.toString() || '',
      active: zone.active
    });
    setIsDialogOpen(true);
  };

  const handleDeleteZone = async (zoneId: string, zoneName: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-zones', {
        body: { action: 'delete', zoneId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      toast({
        title: "Zone supprimée",
        description: `La zone "${zoneName}" a été supprimée avec succès.`,
      });
      loadZones();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la zone géographique",
        variant: "destructive"
      });
    }
  };

  const toggleZoneStatus = async (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    const updatedZoneData = {
      nom_zone: zone.nom_zone,
      codes_postaux: zone.codes_postaux,
      type_zone: zone.type_zone,
      rayon_km: zone.rayon_km,
      active: !zone.active
    };

    try {
      const { data, error } = await supabase.functions.invoke('admin-zones', {
        body: { action: 'update', zoneData: updatedZoneData, zoneId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      toast({
        title: `Zone ${zone.active ? 'désactivée' : 'activée'}`,
        description: `La zone "${zone.nom_zone}" est maintenant ${zone.active ? 'inactive' : 'active'}.`,
      });
      loadZones();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la zone",
        variant: "destructive"
      });
    }
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
            <Button onClick={() => {
              setEditingZone(null);
              setFormData({ nom_zone: '', codes_postaux: '', type_zone: 'departement', rayon_km: '', active: true });
            }}>
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
              <div className="space-y-2">
                <Label htmlFor="nom_zone">Nom de la zone</Label>
                <Input
                  id="nom_zone"
                  value={formData.nom_zone}
                  onChange={(e) => setFormData({ ...formData, nom_zone: e.target.value })}
                  placeholder="Ex: 75 - Paris"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type_zone">Type de zone</Label>
                <Select 
                  value={formData.type_zone} 
                  onValueChange={(value) => setFormData({ ...formData, type_zone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departement">Département</SelectItem>
                    <SelectItem value="ville">Ville</SelectItem>
                    <SelectItem value="secteur">Secteur personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codes_postaux">Codes postaux (séparés par des virgules)</Label>
                <Input
                  id="codes_postaux"
                  value={formData.codes_postaux}
                  onChange={(e) => setFormData({ ...formData, codes_postaux: e.target.value })}
                  placeholder="75001, 75002, 75003..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rayon_km">Rayon en km (optionnel)</Label>
                <Input
                  id="rayon_km"
                  type="number"
                  value={formData.rayon_km}
                  onChange={(e) => setFormData({ ...formData, rayon_km: e.target.value })}
                  placeholder="20"
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
              {zones.reduce((sum, zone) => sum + (zone.provider_count || 0), 0)}
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
              {zones.reduce((sum, zone) => sum + (zone.request_count || 0), 0)}
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
            <SelectItem value="departement">Départements</SelectItem>
            <SelectItem value="ville">Villes</SelectItem>
            <SelectItem value="secteur">Secteurs</SelectItem>
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
                  {getTypeIcon(zone.type_zone)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{zone.nom_zone}</h3>
                      {getTypeBadge(zone.type_zone)}
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
                      {zone.codes_postaux.length} codes postaux | {zone.provider_count || 0} prestataires | {zone.request_count || 0} demandes
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.codes_postaux.slice(0, 5).map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                      {zone.codes_postaux.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.codes_postaux.length - 5} autres...
                        </Badge>
                      )}
                    </div>
                    {zone.rayon_km && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Rayon: {zone.rayon_km} km
                      </p>
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
                    onClick={() => handleEdit(zone)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id, zone.nom_zone)}
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