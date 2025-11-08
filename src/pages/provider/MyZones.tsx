import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Star,
  Calendar,
  Pause,
  Play,
  Settings
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface ProviderZone {
  id: string;
  prestataire_id: string;
  zone_id?: string;
  zone_name?: string;
  type_zone?: string;
  adresse_reference: string;
  latitude?: number;
  longitude?: number;
  rayon_km: number;
  statut: 'active' | 'paused' | 'inactive';
  disponibilite: any;
  missions_received?: number;
  missions_accepted?: number;
  total_revenue?: number;
  average_rating?: number;
  last_mission_date?: string;
  created_at: string;
  updated_at: string;
}

const MyZones = () => {
  const [zones, setZones] = useState<ProviderZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ProviderZone | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    adresse_reference: '',
    rayon_km: '10',
    statut: 'active',
    disponibilite: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProviderAndZones();
    }
  }, [user]);

  const loadProviderAndZones = async () => {
    try {
      // Récupérer l'ID du prestataire
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (providerError) throw providerError;
      if (!providerData) {
        toast({
          title: "Erreur",
          description: "Profil prestataire non trouvé",
          variant: "destructive"
        });
        return;
      }

      setProviderId(providerData.id);

      // Charger les zones avec statistiques
      const { data: zonesData, error: zonesError } = await supabase
        .from('prestataire_zones_stats')
        .select('*')
        .eq('prestataire_id', providerData.id)
        .order('created_at', { ascending: false });

      if (zonesError) throw zonesError;
      
      // Cast le statut pour correspondre à l'interface
      const formattedZones = (zonesData || []).map(zone => ({
        ...zone,
        statut: zone.statut as 'active' | 'paused' | 'inactive'
      }));
      
      setZones(formattedZones);
    } catch (error) {
      console.error('Erreur chargement zones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos zones d'intervention",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveZone = async () => {
    if (!providerId) return;
    if (!formData.adresse_reference.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse",
        variant: "destructive"
      });
      return;
    }

    try {
      const zoneData: any = {
        prestataire_id: providerId,
        adresse_reference: formData.adresse_reference,
        rayon_km: parseInt(formData.rayon_km),
        statut: formData.statut,
        disponibilite: formData.disponibilite
      };

      if (editingZone) {
        // Modification
        const { error } = await supabase
          .from('prestataire_zones')
          .update(zoneData)
          .eq('id', editingZone.id);

        if (error) throw error;

        toast({
          title: "Zone modifiée",
          description: "Votre zone d'intervention a été mise à jour"
        });
      } else {
        // Création
        const { error } = await supabase
          .from('prestataire_zones')
          .insert([zoneData]);

        if (error) {
          if (error.message.includes('Limite de zones atteinte')) {
            toast({
              title: "Limite atteinte",
              description: "Vous avez atteint le nombre maximum de zones actives (5)",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Zone ajoutée",
          description: "Votre nouvelle zone d'intervention a été créée"
        });
      }

      setIsDialogOpen(false);
      setEditingZone(null);
      setFormData({
        adresse_reference: '',
        rayon_km: '10',
        statut: 'active',
        disponibilite: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        }
      });
      loadProviderAndZones();
    } catch (error) {
      console.error('Erreur sauvegarde zone:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la zone",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (zone: ProviderZone) => {
    setEditingZone(zone);
    setFormData({
      adresse_reference: zone.adresse_reference,
      rayon_km: zone.rayon_km.toString(),
      statut: zone.statut,
      disponibilite: zone.disponibilite
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (zoneId: string, adresse: string) => {
    if (!confirm(`Supprimer la zone "${adresse}" ?`)) return;

    try {
      const { error } = await supabase
        .from('prestataire_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: "Zone supprimée",
        description: "La zone d'intervention a été supprimée"
      });
      loadProviderAndZones();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la zone",
        variant: "destructive"
      });
    }
  };

  const toggleZoneStatus = async (zoneId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('prestataire_zones')
        .update({ statut: newStatus })
        .eq('id', zoneId);

      if (error) throw error;

      toast({
        title: newStatus === 'active' ? "Zone activée" : "Zone en pause",
        description: `La zone est maintenant ${newStatus === 'active' ? 'active' : 'en pause'}`
      });
      loadProviderAndZones();
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  };

  const updateDisponibilite = (day: string, value: boolean) => {
    setFormData({
      ...formData,
      disponibilite: {
        ...formData.disponibilite,
        [day]: value
      }
    });
  };

  const totalRevenue = zones.reduce((sum, z) => sum + (z.total_revenue || 0), 0);
  const totalMissions = zones.reduce((sum, z) => sum + (z.missions_received || 0), 0);
  const activeZones = zones.filter(z => z.statut === 'active').length;
  const avgRating = zones.length > 0 
    ? zones.reduce((sum, z) => sum + (z.average_rating || 0), 0) / zones.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zones d'Intervention</h1>
          <p className="text-muted-foreground">Gérez où vous souhaitez intervenir</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingZone(null);
              setFormData({
                adresse_reference: '',
                rayon_km: '10',
                statut: 'active',
                disponibilite: {
                  monday: true,
                  tuesday: true,
                  wednesday: true,
                  thursday: true,
                  friday: true,
                  saturday: false,
                  sunday: false
                }
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Modifier la zone' : 'Ajouter une zone d\'intervention'}
              </DialogTitle>
              <DialogDescription>
                Définissez votre zone d'intervention et votre disponibilité
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="adresse">🗺️ Adresse de référence *</Label>
                <Input
                  id="adresse"
                  value={formData.adresse_reference}
                  onChange={(e) => setFormData({ ...formData, adresse_reference: e.target.value })}
                  placeholder="Ex: Rueil-Malmaison, 92500"
                />
                <p className="text-xs text-muted-foreground">
                  Le système détectera automatiquement la zone géographique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rayon">📏 Rayon d'intervention (km) *</Label>
                <Select 
                  value={formData.rayon_km} 
                  onValueChange={(value) => setFormData({ ...formData, rayon_km: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="15">15 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="30">30 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">⚙️ Statut</Label>
                <Select 
                  value={formData.statut} 
                  onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">✅ Active</SelectItem>
                    <SelectItem value="paused">⏸️ En pause</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>🕒 Disponibilité dans cette zone</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'monday', label: 'Lundi' },
                    { key: 'tuesday', label: 'Mardi' },
                    { key: 'wednesday', label: 'Mercredi' },
                    { key: 'thursday', label: 'Jeudi' },
                    { key: 'friday', label: 'Vendredi' },
                    { key: 'saturday', label: 'Samedi' },
                    { key: 'sunday', label: 'Dimanche' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                      <Switch
                        id={key}
                        checked={formData.disponibilite[key]}
                        onCheckedChange={(checked) => updateDisponibilite(key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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

      {/* Message d'information */}
      {zones.length === 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Définissez vos zones d'intervention
                </h3>
                <p className="text-sm text-blue-800">
                  Ajoutez les zones où vous souhaitez intervenir pour recevoir des missions proches de chez vous.
                  Plus vous couvrez de zones, plus vous recevrez d'opportunités !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limite atteinte */}
      {activeZones >= 5 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  Limite de zones atteinte
                </h3>
                <p className="text-sm text-orange-800">
                  Vous avez atteint la limite de 5 zones actives. Mettez une zone en pause pour en ajouter une nouvelle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Zones Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeZones}</div>
            <p className="text-xs text-muted-foreground mt-1">
              sur {zones.length} zone{zones.length > 1 ? 's' : ''} totale{zones.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Missions Reçues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes zones confondues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenus Générés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total par zone
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Note Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {avgRating.toFixed(1)}
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Satisfaction clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des zones */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Zones d'Intervention</CardTitle>
          <CardDescription>
            Voici les zones où vous êtes actuellement disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune zone d'intervention configurée</p>
              <p className="text-sm">Cliquez sur "Ajouter une zone" pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Ville(s) couvertes</TableHead>
                  <TableHead className="text-center">Distance max</TableHead>
                  <TableHead className="text-center">Missions</TableHead>
                  <TableHead className="text-center">Revenus</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">{zone.zone_name || 'Zone'}</div>
                          <div className="text-xs text-muted-foreground">
                            {zone.type_zone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{zone.adresse_reference}</div>
                      {zone.last_mission_date && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Dernière mission: {new Date(zone.last_mission_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{zone.rayon_km} km</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-medium">{zone.missions_received || 0}</div>
                      <div className="text-xs text-muted-foreground">
                        {zone.missions_accepted || 0} acceptées
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(zone.total_revenue || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {zone.average_rating && zone.average_rating > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{zone.average_rating.toFixed(1)}</span>
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={zone.statut === 'active' ? "default" : zone.statut === 'paused' ? "secondary" : "destructive"}
                      >
                        {zone.statut === 'active' && <><CheckCircle className="w-3 h-3 mr-1" />Active</>}
                        {zone.statut === 'paused' && <><Pause className="w-3 h-3 mr-1" />En pause</>}
                        {zone.statut === 'inactive' && <><AlertCircle className="w-3 h-3 mr-1" />Inactive</>}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleZoneStatus(zone.id, zone.statut)}
                        >
                          {zone.statut === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(zone)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(zone.id, zone.adresse_reference)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info pratique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <p>
              <strong>Géolocalisation automatique :</strong> Le système détecte automatiquement votre zone en fonction de votre adresse.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <p>
              <strong>Missions ciblées :</strong> Vous ne recevrez que les missions situées dans vos zones actives.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <p>
              <strong>Limite de zones :</strong> Maximum 5 zones actives simultanées. Mettez une zone en pause pour en ajouter une nouvelle.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
            <p>
              <strong>Suspension automatique :</strong> Si vous refusez plusieurs missions dans une zone, elle pourra être mise en pause automatiquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyZones;
