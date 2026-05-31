import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Search, Globe, Map, CheckCircle, AlertCircle, Users, TrendingUp, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeographicZone, ZoneFormData } from './zones/types';
import { ZoneFormDialog } from './zones/ZoneFormDialog';
import { ZonesTable } from './zones/ZonesTable';
import { ProviderAssignmentDialog } from './zones/ProviderAssignmentDialog';

const EMPTY_FORM: ZoneFormData = {
  nom_zone: '',
  codes_postaux: '',
  villes_couvertes: '',
  type_zone: 'ville',
  rayon_km: '',
  statut: 'active',
  description: '',
  active: true,
};

const Zones = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GeographicZone | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>(EMPTY_FORM);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [selectedZoneForProviders, setSelectedZoneForProviders] = useState<GeographicZone | null>(null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [showAlerts, setShowAlerts] = useState(true);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const { toast } = useToast();

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase.from('zone_statistics').select('*').order('nom_zone');
      if (error) throw error;
      return (data || []).map(zone => ({
        ...zone,
        type_zone: zone.type_zone as GeographicZone['type_zone'],
        statut: (zone.statut || 'active') as GeographicZone['statut'],
      }));
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['zone-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone_alerts_with_details')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const loadAvailableProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, is_verified, postal_codes, profiles!providers_user_id_fkey(first_name, last_name)')
        .eq('is_verified', true);
      if (error) throw error;
      setAvailableProviders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
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

      toast({ title: "Alerte résolue", description: "L'alerte a été marquée comme résolue" });
      qc.invalidateQueries({ queryKey: ['zone-alerts'] });
      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      toast({ title: "Erreur", description: "Impossible de résoudre l'alerte", variant: "destructive" });
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setCheckingAlerts(true);
      const { error } = await supabase.functions.invoke('check-zone-alerts');
      if (error) throw error;
      toast({ title: "Vérification terminée", description: "Les alertes ont été mises à jour" });
      qc.invalidateQueries({ queryKey: ['zone-alerts'] });
      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error('Erreur vérification alertes:', error);
      toast({ title: "Erreur", description: "Impossible de vérifier les alertes", variant: "destructive" });
    } finally {
      setCheckingAlerts(false);
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
    const variants = { departement: 'default', ville: 'secondary', secteur: 'outline' };
    return <Badge variant={variants[type as keyof typeof variants] as any}>{type}</Badge>;
  };

  const handleSaveZone = async () => {
    const codesPostaux = formData.codes_postaux.split(',').map(c => c.trim()).filter(Boolean);
    const villesCouvertes = formData.villes_couvertes.split(',').map(v => v.trim()).filter(Boolean);
    const zoneData = {
      nom_zone: formData.nom_zone,
      codes_postaux: codesPostaux,
      villes_couvertes: villesCouvertes,
      type_zone: formData.type_zone,
      rayon_km: formData.rayon_km ? parseInt(formData.rayon_km) : null,
      statut: formData.statut,
      description: formData.description || null,
      active: formData.active,
    };

    try {
      const action = editingZone ? 'update' : 'create';
      const requestBody = editingZone ? { action, zoneData, zoneId: editingZone.id } : { action, zoneData };
      const { data, error } = await supabase.functions.invoke('admin-zones', { body: requestBody });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: editingZone ? "Zone modifiée" : "Zone créée", description: data.message });
      setIsDialogOpen(false);
      setEditingZone(null);
      setFormData(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder la zone géographique", variant: "destructive" });
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
      active: zone.active,
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
      const { data: existing } = await supabase
        .from('zone_prestataires')
        .select('id')
        .eq('zone_id', selectedZoneForProviders.id)
        .eq('prestataire_id', providerId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('zone_prestataires')
          .delete()
          .eq('zone_id', selectedZoneForProviders.id)
          .eq('prestataire_id', providerId);

        if (error) throw error;
        toast({ title: "Prestataire retiré", description: "Le prestataire a été retiré de cette zone" });
      } else {
        const { error } = await supabase
          .from('zone_prestataires')
          .insert({ zone_id: selectedZoneForProviders.id, prestataire_id: providerId });

        if (error) throw error;
        toast({ title: "Prestataire assigné", description: "Le prestataire a été assigné à cette zone" });
      }

      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      toast({ title: "Erreur", description: "Impossible de modifier l'assignation", variant: "destructive" });
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

      toast({ title: "Zone supprimée", description: `La zone "${zoneName}" a été supprimée avec succès.` });
      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({ title: "Erreur", description: "Impossible de supprimer la zone géographique", variant: "destructive" });
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
      active: !zone.active,
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
      qc.invalidateQueries({ queryKey: ['zones'] });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({ title: "Erreur", description: "Impossible de modifier le statut de la zone", variant: "destructive" });
    }
  };

  if (isLoading) {
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
      {alerts.length > 0 && showAlerts && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">🚨 Alertes Zones ({alerts.length})</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCheckAlerts} disabled={checkingAlerts}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Vérifier maintenant
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>Masquer</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                        <span className="font-semibold">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">{alert.nom_zone}</Badge>
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
                    <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zones Géographiques</h1>
          <p className="text-muted-foreground">Gestion des zones de couverture du service</p>
        </div>
        <ZoneFormDialog
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          editingZone={editingZone}
          formData={formData}
          setFormData={setFormData}
          handleSaveZone={handleSaveZone}
          onOpenNewZone={() => { setEditingZone(null); setFormData(EMPTY_FORM); }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Zones</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
            <Badge variant="secondary" className="mt-1">{zones.filter(z => z.active).length} actives</Badge>
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
            <div className={`text-2xl font-bold ${alerts.length > 0 ? 'text-red-600' : ''}`}>{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{alerts.filter(a => a.severity === 'critical').length} critiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Prestataires Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.reduce((sum, z) => sum + (z.provider_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Répartis sur toutes les zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Missions Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.reduce((sum, z) => sum + (z.missions_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Missions réalisées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">CA Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                zones.reduce((sum, z) => sum + (z.ca_total || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Chiffre d'affaires total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Clients Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.reduce((sum, z) => sum + (z.client_count || 0), 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Clients actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {zones.length > 0 ? (
                <>
                  {(zones.reduce((sum, z) => sum + (z.satisfaction_moyenne || 0), 0) / zones.length).toFixed(1)}
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                </>
              ) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Note moyenne globale</p>
          </CardContent>
        </Card>
      </div>

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

      <ZonesTable
        filteredZones={filteredZones}
        getTypeIcon={getTypeIcon}
        getTypeBadge={getTypeBadge}
        handleEdit={handleEdit}
        handleAssignProviders={handleAssignProviders}
        toggleZoneStatus={toggleZoneStatus}
        handleDeleteZone={handleDeleteZone}
      />

      <ProviderAssignmentDialog
        showProviderDialog={showProviderDialog}
        setShowProviderDialog={setShowProviderDialog}
        selectedZoneForProviders={selectedZoneForProviders}
        availableProviders={availableProviders}
        providerSearch={providerSearch}
        setProviderSearch={setProviderSearch}
        handleToggleProviderAssignment={handleToggleProviderAssignment}
      />
    </div>
  );
};

export default Zones;
