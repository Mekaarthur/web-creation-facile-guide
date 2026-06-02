import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Star, Euro } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  provider_services: {
    service_id: string;
    price_override: number | null;
  }[];
  provider_availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
  provider_locations?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  }[];
}

interface MapViewProps {
  providers: Provider[];
  userLocation?: { lat: number; lng: number };
  selectedServiceId?: string;
  onProviderSelect: (provider: Provider) => void;
}

// Fonction pour calculer la distance entre deux points (formule de Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

export const MapView = ({ providers, userLocation, selectedServiceId, onProviderSelect }: MapViewProps) => {
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(userLocation || null);
  const [providersWithDistance, setProvidersWithDistance] = useState<(Provider & { distance?: number })[]>([]);

  // Demander la géolocalisation de l'utilisateur
  useEffect(() => {
    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }, [userLocation]);

  // Calculer les distances et trier par proximité
  useEffect(() => {
    if (userPosition && providers.length > 0) {
      const withDistances = providers.map(provider => {
        let minDistance = Infinity;
        
        provider.provider_locations?.forEach(location => {
          const distance = calculateDistance(
            userPosition.lat,
            userPosition.lng,
            location.latitude,
            location.longitude
          );
          minDistance = Math.min(minDistance, distance);
        });

        return {
          ...provider,
          distance: minDistance === Infinity ? undefined : Math.round(minDistance * 10) / 10
        };
      });

      // Trier par distance croissante
      withDistances.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      setProvidersWithDistance(withDistances);
    } else {
      setProvidersWithDistance(providers);
    }
  }, [providers, userPosition]);

  const getProviderDisplayName = (provider: Provider) => {
    if (provider.business_name) return provider.business_name;
    if (provider.profiles?.first_name && provider.profiles?.last_name) {
      return `${provider.profiles.first_name} ${provider.profiles.last_name}`;
    }
    return "Prestataire";
  };

  const getProviderPrice = (provider: Provider): number => {
    if (!selectedServiceId) return 0;
    const providerService = provider.provider_services?.find(ps => ps.service_id === selectedServiceId);
    return providerService?.price_override || 0;
  };

  return (
    <div className="space-y-4">
      {/* Header avec géolocalisation */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {userPosition 
              ? "Prestataires triés par distance" 
              : "Géolocalisation non disponible"
            }
          </span>
        </div>
        {userPosition && (
          <Badge variant="secondary">
            Position détectée
          </Badge>
        )}
      </div>

      {/* Carte simple avec liste des prestataires */}
      <div className="grid gap-4">
        {providersWithDistance.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun prestataire trouvé dans votre zone</p>
            </CardContent>
          </Card>
        ) : (
          providersWithDistance.map((provider, index) => (
            <Card 
              key={provider.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => onProviderSelect(provider)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getProviderDisplayName(provider)}</span>
                      {index < 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {provider.distance !== undefined && (
                        <div className="flex items-center gap-1 text-primary">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{provider.distance} km</span>
                        </div>
                      )}
                      
                      {provider.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{provider.rating}</span>
                        </div>
                      )}
                      
                      {selectedServiceId && getProviderPrice(provider) > 0 && (
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          <span>{getProviderPrice(provider)}€/h</span>
                        </div>
                      )}
                    </div>

                    {provider.provider_locations && provider.provider_locations.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {provider.provider_locations[0].city}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Sélectionner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};