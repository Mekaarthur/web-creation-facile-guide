import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postal_code: string;
  service_radius: number;
  zones_couvertes?: string[];
}

interface GeolocationManagerProps {
  providerId?: string;
  onLocationUpdated?: (location: Location) => void;
}

const GeolocationManager: React.FC<GeolocationManagerProps> = ({
  providerId,
  onLocationUpdated
}) => {
  const [location, setLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
    address: '',
    city: '',
    postal_code: '',
    service_radius: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadZones();
    if (providerId) {
      loadProviderLocation();
    }
  }, [providerId]);

  const loadZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones_geographiques' as any)
        .select('*')
        .order('nom_zone');

      if (error) throw error;
      setZones((data as unknown as any[]) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
    }
  };

  const loadProviderLocation = async () => {
    if (!providerId) return;

    try {
      // Charger d'abord depuis provider_locations
      const { data: locationData, error: locationError } = await supabase
        .from('provider_locations')
        .select('*')
        .eq('provider_id', providerId)
        .single();

      if (locationError && locationError.code !== 'PGRST116') throw locationError;
      
      // Charger aussi les zones couvertes depuis providers
      const { data: providerData, error: providerError } = await supabase
        .from('providers' as any)
        .select('zones_couvertes')
        .eq('id', providerId)
        .single();

      if (providerError) throw providerError;
      
      if (locationData) {
        setLocation(locationData);
      }

      if (providerData && (providerData as any).zones_couvertes) {
        setSelectedZones((providerData as any).zones_couvertes);
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erreur",
        description: "La géolocalisation n'est pas supportée",
        variant: "destructive",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Utiliser l'API de géocodage inverse pour obtenir l'adresse
          const response = await fetch(
            `https://api.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            setLocation(prev => ({
              ...prev,
              latitude,
              longitude,
              address: `${data.address.house_number || ''} ${data.address.road || ''}`.trim(),
              city: data.address.city || data.address.town || data.address.village || '',
              postal_code: data.address.postcode || ''
            }));
          } else {
            setLocation(prev => ({
              ...prev,
              latitude,
              longitude
            }));
          }

          toast({
            title: "Succès",
            description: "Position géographique récupérée",
          });
        } catch (error) {
          console.error('Error with reverse geocoding:', error);
          setLocation(prev => ({
            ...prev,
            latitude,
            longitude
          }));
        }
        
        setLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer votre position",
          variant: "destructive",
        });
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const saveLocation = async () => {
    if (!providerId) return;

    setSaving(true);
    try {
      const locationData = {
        provider_id: providerId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        postal_code: location.postal_code,
        service_radius: location.service_radius,
      };

      const { error: locationError } = await supabase
        .from('provider_locations')
        .upsert(locationData, {
          onConflict: 'provider_id'
        });

      if (locationError) throw locationError;

      // Mettre à jour aussi les zones couvertes dans la table providers
      const { error: providerError } = await supabase
        .from('providers' as any)
        .update({ zones_couvertes: selectedZones })
        .eq('id', providerId);

      if (providerError) throw providerError;

      toast({
        title: "Succès",
        description: "Localisation enregistrée",
      });

      onLocationUpdated?.({ ...location, zones_couvertes: selectedZones });
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la localisation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Location, value: string | number) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleZone = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Géolocalisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Géolocalisation et zone de service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={getCurrentLocation}
            disabled={locating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {locating ? 'Localisation...' : 'Ma position'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={location.latitude}
              onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={location.longitude}
              onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={location.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 rue de la République"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={location.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Paris"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postal_code">Code postal</Label>
            <Input
              id="postal_code"
              value={location.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="75001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_radius">Rayon de service (km)</Label>
          <Input
            id="service_radius"
            type="number"
            min="1"
            max="100"
            value={location.service_radius}
            onChange={(e) => handleInputChange('service_radius', parseInt(e.target.value) || 20)}
          />
        </div>

        <div className="space-y-2">
          <Label>Zones de couverture</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {zones.map((zone) => (
              <Button
                key={zone.id}
                variant={selectedZones.includes(zone.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleZone(zone.id)}
                className="justify-start text-xs"
              >
                {zone.nom_zone}
              </Button>
            ))}
          </div>
          {selectedZones.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedZones.length} zone(s) sélectionnée(s)
            </p>
          )}
        </div>

        <Button 
          onClick={saveLocation}
          disabled={saving || !location.latitude || !location.longitude}
          className="w-full flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer la localisation'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GeolocationManager;