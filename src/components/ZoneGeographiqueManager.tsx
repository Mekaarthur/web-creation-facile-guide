import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ZoneGeographique {
  id: string;
  nom_zone: string;
  codes_postaux: string[];
  type_zone: string;
  rayon_km?: number;
  created_at: string;
  updated_at: string;
}

const ZoneGeographiqueManager = () => {
  const [zones, setZones] = useState<ZoneGeographique[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneGeographique | null>(null);
  const [formData, setFormData] = useState({
    nom_zone: '',
    codes_postaux: '',
    type_zone: 'departement',
    rayon_km: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones_geographiques' as any)
        .select('*')
        .order('nom_zone');

      if (error) throw error;
      setZones((data as unknown as ZoneGeographique[]) || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const codesPostaux = formData.codes_postaux
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    const zoneData = {
      nom_zone: formData.nom_zone,
      codes_postaux: codesPostaux,
      type_zone: formData.type_zone,
      rayon_km: formData.rayon_km ? parseInt(formData.rayon_km) : null
    };

    try {
      if (editingZone) {
        const { error } = await supabase
          .from('zones_geographiques' as any)
          .update(zoneData)
          .eq('id', editingZone.id);
        
        if (error) throw error;
        toast({
          title: "Zone modifiée",
          description: "La zone géographique a été modifiée avec succès"
        });
      } else {
        const { error } = await supabase
          .from('zones_geographiques' as any)
          .insert([zoneData]);
        
        if (error) throw error;
        toast({
          title: "Zone créée",
          description: "La zone géographique a été créée avec succès"
        });
      }

      setIsDialogOpen(false);
      setEditingZone(null);
      setFormData({ nom_zone: '', codes_postaux: '', type_zone: 'departement', rayon_km: '' });
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

  const handleEdit = (zone: ZoneGeographique) => {
    setEditingZone(zone);
    setFormData({
      nom_zone: zone.nom_zone,
      codes_postaux: zone.codes_postaux.join(', '),
      type_zone: zone.type_zone,
      rayon_km: zone.rayon_km?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

    try {
      const { error } = await supabase
        .from('zones_geographiques' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Zone supprimée",
        description: "La zone géographique a été supprimée avec succès"
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

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des zones géographiques</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingZone(null);
              setFormData({ nom_zone: '', codes_postaux: '', type_zone: 'departement', rayon_km: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Modifier la zone' : 'Ajouter une nouvelle zone'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom_zone">Nom de la zone</Label>
                <Input
                  id="nom_zone"
                  value={formData.nom_zone}
                  onChange={(e) => setFormData({ ...formData, nom_zone: e.target.value })}
                  placeholder="Ex: 75 - Paris"
                  required
                />
              </div>
              
              <div>
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

              <div>
                <Label htmlFor="codes_postaux">Codes postaux (séparés par des virgules)</Label>
                <Input
                  id="codes_postaux"
                  value={formData.codes_postaux}
                  onChange={(e) => setFormData({ ...formData, codes_postaux: e.target.value })}
                  placeholder="75001, 75002, 75003..."
                  required
                />
              </div>

              <div>
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingZone ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {zone.nom_zone}
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(zone)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(zone.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Type: </span>
                  <Badge variant="secondary">{zone.type_zone}</Badge>
                </div>
                
                {zone.rayon_km && (
                  <div>
                    <span className="text-sm font-medium">Rayon: </span>
                    <span className="text-sm">{zone.rayon_km} km</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium">Codes postaux ({zone.codes_postaux.length}): </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.codes_postaux.slice(0, 10).map((code) => (
                      <Badge key={code} variant="outline" className="text-xs">
                        {code}
                      </Badge>
                    ))}
                    {zone.codes_postaux.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{zone.codes_postaux.length - 10} autres...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ZoneGeographiqueManager;