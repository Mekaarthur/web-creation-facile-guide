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
  AlertCircle,
  Users,
  TrendingUp,
  Building2,
  Star,
  MapPinOff,
  UserPlus,
  Filter
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GeographicZone {
  id: string;
  nom_zone: string;
  type_zone: 'region' | 'ville' | 'metropole' | 'departement' | 'secteur';
  codes_postaux: string[];
  villes_couvertes: string[];
  rayon_km?: number;
  active: boolean;
  statut: 'active' | 'inactive' | 'test';
  description?: string;
  responsable_id?: string;
  provider_count?: number;
  client_count?: number;
  missions_count?: number;
  satisfaction_moyenne?: number;
  ca_total?: number;
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
    villes_couvertes: '',
    type_zone: 'ville',
    rayon_km: '',
    statut: 'active',
    description: '',
    active: true
  });
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [selectedZoneForProviders, setSelectedZoneForProviders] = useState<GeographicZone | null>(null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadZones();
    loadAlerts();
  }, []);

  const loadZones = async () => {
    try {
      // Charger les zones avec statistiques depuis la vue
      const { data: zonesData, error } = await supabase
        .from('zone_statistics')
        .select('*')
        .order('nom_zone');

      if (error) throw error;
      
      // Cast le type_zone pour correspondre à l'interface
      const formattedZones = (zonesData || []).map(zone => ({
        ...zone,
        type_zone: zone.type_zone as 'region' | 'ville' | 'metropole' | 'departement' | 'secteur',
        statut: (zone.statut || 'active') as 'active' | 'inactive' | 'test'
      }));
      
      setZones(formattedZones);
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

  const loadAvailableProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id,
          business_name,
          is_verified,
          postal_codes,
          profiles!providers_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('is_verified', true);

      if (error) throw error;
      setAvailableProviders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('zone_alerts_with_details')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('zone_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue"
      });

      loadAlerts();
      loadZones();
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte",
        variant: "destructive"
      });
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('check-zone-alerts');

      if (error) throw error;

      toast({
        title: "Vérification terminée",
        description: "Les alertes ont été mises à jour"
      });

      loadAlerts();
      loadZones();
    } catch (error) {
      console.error('Erreur vérification alertes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les alertes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📌';
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
      
    const villesCouvertes = formData.villes_couvertes
      .split(',')
      .map(ville => ville.trim())
      .filter(ville => ville.length > 0);

    const zoneData = {
      nom_zone: formData.nom_zone,
      codes_postaux: codesPostaux,
      villes_couvertes: villesCouvertes,
      type_zone: formData.type_zone,
      rayon_km: formData.rayon_km ? parseInt(formData.rayon_km) : null,
      statut: formData.statut,
      description: formData.description || null,
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
      setFormData({ 
        nom_zone: '', 
        codes_postaux: '', 
        villes_couvertes: '',
        type_zone: 'ville', 
        rayon_km: '', 
        statut: 'active',
        description: '',
        active: true 
      });
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
      villes_couvertes: zone.villes_couvertes?.join(', ') || '',
      type_zone: zone.type_zone,
      rayon_km: zone.rayon_km?.toString() || '',
      statut: zone.statut,
      description: zone.description || '',
      active: zone.active
    });
    setIsDialogOpen(true);
  };

  const handleAssignProviders = async (zone: GeographicZone) => {
    setSelectedZoneForProviders(zone);
    await loadAvailableProviders();
    setShowProviderDialog(true);
  };

  const handleToggleProviderAssignment = async (providerId: string) => {
    if (!selectedZoneForProviders) return;

    try {
      // Vérifier si le prestataire est déjà assigné
      const { data: existing } = await supabase
        .from('zone_prestataires')
        .select('id')
        .eq('zone_id', selectedZoneForProviders.id)
        .eq('prestataire_id', providerId)
        .single();

      if (existing) {
        // Retirer l'assignation
        const { error } = await supabase
          .from('zone_prestataires')
          .delete()
          .eq('zone_id', selectedZoneForProviders.id)
          .eq('prestataire_id', providerId);

        if (error) throw error;
        
        toast({
          title: "Prestataire retiré",
          description: "Le prestataire a été retiré de cette zone"
        });
      } else {
        // Ajouter l'assignation
        const { error } = await supabase
          .from('zone_prestataires')
          .insert({
            zone_id: selectedZoneForProviders.id,
            prestataire_id: providerId
          });

        if (error) throw error;
        
        toast({
          title: "Prestataire assigné",
          description: "Le prestataire a été assigné à cette zone"
        });
      }

      // Recharger les zones pour mettre à jour les compteurs
      loadZones();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'assignation",
        variant: "destructive"
      });
    }
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
      villes_couvertes: zone.villes_couvertes,
      type_zone: zone.type_zone,
      rayon_km: zone.rayon_km,
      statut: zone.statut,
      description: zone.description,
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
      {/* Alertes critiques */}
      {alerts.length > 0 && showAlerts && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">
                  🚨 Alertes Zones ({alerts.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckAlerts}
                  disabled={loading}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Vérifier maintenant
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlerts(false)}
                >
                  Masquer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                        <span className="font-semibold">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.nom_zone}
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Valeur actuelle: {alert.current_value}</span>
                        <span>•</span>
                        <span>Seuil: {alert.threshold_value}</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Résoudre
                    </Button>
                  </div>
                </div>
              ))}
              {alerts.length > 5 && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  +{alerts.length - 5} autre{alerts.length - 5 > 1 ? 's' : ''} alerte{alerts.length - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              setFormData({ 
                nom_zone: '', 
                codes_postaux: '', 
                villes_couvertes: '',
                type_zone: 'ville', 
                rayon_km: '', 
                statut: 'active',
                description: '',
                active: true 
              });
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
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_zone">Nom de la zone *</Label>
                  <Input
                    id="nom_zone"
                    value={formData.nom_zone}
                    onChange={(e) => setFormData({ ...formData, nom_zone: e.target.value })}
                    placeholder="Ex: Île-de-France"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type_zone">Type de zone *</Label>
                  <Select 
                    value={formData.type_zone} 
                    onValueChange={(value) => setFormData({ ...formData, type_zone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="region">Région</SelectItem>
                      <SelectItem value="departement">Département</SelectItem>
                      <SelectItem value="metropole">Métropole</SelectItem>
                      <SelectItem value="ville">Ville</SelectItem>
                      <SelectItem value="secteur">Secteur personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="villes_couvertes">Villes couvertes (séparées par des virgules)</Label>
                <Input
                  id="villes_couvertes"
                  value={formData.villes_couvertes}
                  onChange={(e) => setFormData({ ...formData, villes_couvertes: e.target.value })}
                  placeholder="Paris, Boulogne-Billancourt, Nanterre..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codes_postaux">Codes postaux (séparés par des virgules) *</Label>
                <Input
                  id="codes_postaux"
                  value={formData.codes_postaux}
                  onChange={(e) => setFormData({ ...formData, codes_postaux: e.target.value })}
                  placeholder="75001, 75002, 92100..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select 
                    value={formData.statut} 
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">✅ Active</SelectItem>
                      <SelectItem value="inactive">❌ Inactive</SelectItem>
                      <SelectItem value="test">🟡 En test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la zone..."
                />
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
        
        <Card className={alerts.length > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className={alerts.length > 0 ? "w-4 h-4 text-red-500" : "w-4 h-4"} />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alerts.length > 0 ? 'text-red-600' : ''}`}>
              {alerts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.filter(a => a.severity === 'critical').length} critiques
            </p>
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
            <CardTitle className="text-sm font-medium">Missions Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum, zone) => sum + (zone.missions_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Missions réalisées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                zones.reduce((sum, zone) => sum + (zone.ca_total || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chiffre d'affaires total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clients Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.reduce((sum, zone) => sum + (zone.client_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clients actifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {zones.length > 0 ? (
                <>
                  {(zones.reduce((sum, zone) => sum + (zone.satisfaction_moyenne || 0), 0) / zones.length).toFixed(1)}
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                </>
              ) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Note moyenne globale
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
            <SelectItem value="region">Régions</SelectItem>
            <SelectItem value="metropole">Métropoles</SelectItem>
            <SelectItem value="departement">Départements</SelectItem>
            <SelectItem value="ville">Villes</SelectItem>
            <SelectItem value="secteur">Secteurs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des zones */}
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
                    <TableCell>
                      {getTypeBadge(zone.type_zone)}
                    </TableCell>
                    <TableCell>
                      {zone.villes_couvertes && zone.villes_couvertes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {zone.villes_couvertes.slice(0, 3).map((ville, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ville}
                            </Badge>
                          ))}
                          {zone.villes_couvertes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{zone.villes_couvertes.length - 3}
                            </Badge>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleAssignProviders(zone)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Gérer
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {zone.client_count || 0}
                      </Badge>
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
                              <>
                                <MapPinOff className="w-4 h-4 mr-2" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activer
                              </>
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

      {/* Dialog d'assignation des prestataires */}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleProviderAssignment(provider.id)}
                      >
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
    </div>
  );
};

export default Zones;