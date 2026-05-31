import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeSearch } from '@/lib/sanitizeSearch';

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchProvidersByLocation(
  lat: number, lng: number, service: string | undefined, maxRadius: number
): Promise<Provider[]> {
  let query = supabase
    .from('providers')
    .select(`*, provider_locations(latitude, longitude, service_radius, city)`)
    .eq('is_verified', true)
    .not('provider_locations', 'is', null);

  if (service && service !== 'all') query = query.ilike('description', `%${sanitizeSearch(service)}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || [])
    .filter((p: any) => p.provider_locations?.[0])
    .map((p: any) => {
      const loc = p.provider_locations[0];
      const distance = Math.round(calculateDistance(lat, lng, loc.latitude, loc.longitude) * 10) / 10;
      return { ...p, distance, latitude: loc.latitude, longitude: loc.longitude, service_radius: loc.service_radius };
    })
    .filter((p: any) => p.distance <= Math.min(p.service_radius, maxRadius))
    .sort((a: any, b: any) => a.distance - b.distance);
}

export const useGeolocation = ({
  userLatitude,
  userLongitude,
  serviceType,
  maxRadius = 50,
}: UseGeolocationProps = {}) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

  const effectiveLat = userLatitude ?? userLocation?.latitude;
  const effectiveLng = userLongitude ?? userLocation?.longitude;

  const { data: providers = [], isFetching: loading } = useQuery<Provider[]>({
    queryKey: ['providers-by-location', effectiveLat, effectiveLng, serviceType, maxRadius],
    queryFn: () => fetchProvidersByLocation(effectiveLat!, effectiveLng!, serviceType, maxRadius),
    enabled: !!effectiveLat && !!effectiveLng,
    staleTime: 60_000,
  });

  const getUserLocation = () =>
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Géolocalisation non supportée')); return; }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setUserLocation(loc);
          resolve(loc);
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

  const searchProvidersByLocation = async (latitude?: number, longitude?: number, service?: string) => {
    const lat = latitude ?? userLatitude ?? userLocation?.latitude;
    const lng = longitude ?? userLongitude ?? userLocation?.longitude;
    if (!lat || !lng) {
      toast({ title: 'Position requise', description: 'Veuillez autoriser la géolocalisation pour trouver des prestataires près de vous', variant: 'destructive' });
      return;
    }
    if (latitude) setUserLocation({ latitude: lat, longitude: lng });
  };

  return {
    providers,
    loading,
    userLocation,
    getUserLocation,
    searchProvidersByLocation,
    calculateDistance,
  };
};
