import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Provider {
  id: string;
  business_name: string;
  rating: number;
  location: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

interface UseGeolocationProps {
  userLatitude?: number;
  userLongitude?: number;
  serviceType?: string;
  maxRadius?: number;
}

export const useGeolocation = ({
  userLatitude,
  userLongitude,
  serviceType,
  maxRadius = 50
}: UseGeolocationProps = {}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { toast } = useToast();

  // Obtenir la position de l'utilisateur
  const getUserLocation = () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(coords);
          resolve(coords);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Rechercher les prestataires par géolocalisation
  const searchProvidersByLocation = async (
    latitude?: number,
    longitude?: number,
    service?: string
  ) => {
    const lat = latitude || userLatitude || userLocation?.latitude;
    const lng = longitude || userLongitude || userLocation?.longitude;

    if (!lat || !lng) {
      toast({
        title: "Position requise",
        description: "Veuillez autoriser la géolocalisation pour trouver des prestataires près de vous",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Récupérer les prestataires avec leurs coordonnées
      let query = supabase
        .from('providers')
        .select(`
          *,
          provider_locations (
            latitude,
            longitude,
            service_radius,
            city
          )
        `)
        .eq('is_verified', true)
        .not('provider_locations', 'is', null);

      if (service && service !== 'all') {
        query = query.ilike('description', `%${service}%`);
      }

      const { data: providersData, error } = await query;

      if (error) throw error;

      // Calculer les distances et filtrer par rayon
      const providersWithDistance = providersData
        .filter(provider => provider.provider_locations?.[0])
        .map(provider => {
          const providerLoc = provider.provider_locations[0];
          const distance = calculateDistance(
            lat,
            lng,
            providerLoc.latitude,
            providerLoc.longitude
          );

          return {
            ...provider,
            distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
            latitude: providerLoc.latitude,
            longitude: providerLoc.longitude,
            service_radius: providerLoc.service_radius
          };
        })
        .filter(provider => 
          provider.distance <= Math.min(provider.service_radius, maxRadius)
        )
        .sort((a, b) => a.distance - b.distance);

      setProviders(providersWithDistance);

    } catch (error: any) {
      console.error('Error searching providers by location:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rechercher les prestataires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer la distance entre deux points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Auto-recherche si les paramètres changent
  useEffect(() => {
    if (userLatitude && userLongitude) {
      searchProvidersByLocation(userLatitude, userLongitude, serviceType);
    }
  }, [userLatitude, userLongitude, serviceType]);

  return {
    providers,
    loading,
    userLocation,
    getUserLocation,
    searchProvidersByLocation,
    calculateDistance
  };
};