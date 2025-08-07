import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchProvidersRequest {
  serviceType: string;
  location: string;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  latitude?: number;
  longitude?: number;
  minRating?: number;
  maxPrice?: number;
  dateTime?: string;
  preferredLanguage?: string;
  budget?: number;
  requiredCertifications?: string[];
}

interface AdvancedFilters {
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'weekend';
  serviceComplexity?: 'simple' | 'medium' | 'complex';
  clientHistory?: number; // Nombre de services déjà réservés par le client
}

// Fonction de calcul de distance haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Algorithme de scoring avancé avec IA
const calculateAdvancedScore = (provider: any, request: MatchProvidersRequest, demandMetrics: any, distance?: number): number => {
  let score = 0;
  const weights = {
    rating: 25,
    distance: 20,
    availability: 20,
    experience: 15,
    price: 10,
    responsiveness: 5,
    specialization: 5
  };

  // Score rating (0-25 points)
  if (provider.rating) {
    score += (provider.rating / 5) * weights.rating;
  }

  // Score distance (0-20 points) - Plus proche = meilleur score
  if (distance !== undefined) {
    const maxDistance = 50; // km
    score += Math.max(0, ((maxDistance - distance) / maxDistance) * weights.distance);
  }

  // Score disponibilité basé sur les créneaux et l'urgence (0-20 points)
  if (provider.availability_slots && provider.availability_slots.length > 0) {
    const urgencyMultiplier = {
      'low': 0.8,
      'normal': 1.0,
      'high': 1.3,
      'urgent': 1.5
    }[request.urgency || 'normal'];
    
    score += weights.availability * urgencyMultiplier;
  }

  // Score expérience (0-15 points)
  const completedMissions = provider.missions_completed || 0;
  score += Math.min(weights.experience, completedMissions * 0.5);

  // Score prix compétitif (0-10 points)
  if (request.budget && provider.hourly_rate) {
    const priceRatio = provider.hourly_rate / request.budget;
    if (priceRatio <= 1) {
      score += weights.price * (1 - priceRatio * 0.5);
    }
  }

  // Score réactivité (0-5 points)
  if (provider.last_activity_at) {
    const daysSinceActivity = (Date.now() - new Date(provider.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, weights.responsiveness * (1 - daysSinceActivity / 7));
  }

  // Score spécialisation service (0-5 points)
  if (provider.services_offered) {
    const hasSpecialization = provider.services_offered.some((service: any) => 
      service.service_name.toLowerCase().includes(request.serviceType.toLowerCase())
    );
    if (hasSpecialization) score += weights.specialization;
  }

  // Bonus pour faible demande (anti-surge pricing)
  if (demandMetrics.service_demand < 3) {
    score += 10;
  }

  // Malus pour surcharge
  if (demandMetrics.service_demand > 8) {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { serviceType, location, urgency = 'normal', latitude, longitude, minRating, maxPrice, dateTime, budget, requiredCertifications }: MatchProvidersRequest = await req.json();
    console.log('Advanced matching for:', { serviceType, location, urgency, hasCoordinates: !!(latitude && longitude) });

    // Limite dynamique basée sur l'urgence
    const searchLimit = {
      'low': 3,
      'normal': 5,
      'high': 8,
      'urgent': 15
    }[urgency] || 5;

    // Get matching providers using enhanced function
    const { data: matchingProviders, error: matchError } = await supabaseClient
      .rpc('get_matching_providers', {
        p_service_type: serviceType,
        p_location: location,
        p_limit: searchLimit,
        p_date_time: dateTime ? new Date(dateTime).toISOString() : null
      });

    if (matchError) {
      console.error('Error matching providers:', matchError);
      throw matchError;
    }

    // Get recent client requests for context
    const { data: recentRequests, error: requestsError } = await supabaseClient
      .from('client_requests')
      .select('*')
      .eq('status', 'new')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      console.error('Error getting recent requests:', requestsError);
    }

    // Calculate demand metrics
    const demandMetrics = {
      total_requests_24h: recentRequests?.length || 0,
      service_demand: recentRequests?.filter(r => 
        r.service_type.toLowerCase().includes(serviceType.toLowerCase())
      ).length || 0,
      location_demand: recentRequests?.filter(r => 
        r.location.toLowerCase().includes(location.toLowerCase())
      ).length || 0
    };

    // Enhanced provider scoring with geo-location and AI-driven matching
    const enhancedProviders = await Promise.all((matchingProviders || []).map(async provider => {
      let distance: number | undefined;
      
      // Calcul de distance si coordonnées disponibles
      if (latitude && longitude && provider.location) {
        // Essayer d'extraire les coordonnées de la localisation du prestataire
        // Pour l'instant, utilisation d'une approximation basée sur la ville
        // Dans un vrai projet, il faudrait géocoder les adresses
        const providerCoords = await geocodeLocation(provider.location);
        if (providerCoords) {
          distance = calculateDistance(latitude, longitude, providerCoords.lat, providerCoords.lng);
        }
      }

      // Filtres de base
      if (minRating && provider.rating < minRating) return null;
      if (maxPrice && provider.hourly_rate > maxPrice) return null;
      if (distance && distance > 50) return null; // Max 50km

      // Calcul du score avancé
      const advancedScore = calculateAdvancedScore(provider, { serviceType, location, urgency, latitude, longitude, budget }, demandMetrics, distance);
      
      return {
        ...provider,
        distance,
        advanced_score: advancedScore,
        availability_score: provider.match_score + advancedScore,
        recommended: advancedScore >= 70 && provider.rating >= 3.5,
        urgent_available: urgency === 'urgent' && provider.availability_slots?.length > 0,
        price_competitive: budget ? (provider.hourly_rate || 0) <= budget * 1.1 : true
      };
    }));

    // Filtrer les prestataires null et trier par score
    const validProviders = enhancedProviders
      .filter(p => p !== null)
      .sort((a, b) => b.advanced_score - a.advanced_score);

    // Fonction de géocodage simple (à remplacer par une vraie API)
    async function geocodeLocation(location: string): Promise<{lat: number, lng: number} | null> {
      // Coordonnées approximatives des principales villes françaises
      const cityCoords: {[key: string]: {lat: number, lng: number}} = {
        'paris': {lat: 48.8566, lng: 2.3522},
        'lyon': {lat: 45.7640, lng: 4.8357},
        'marseille': {lat: 43.2965, lng: 5.3698},
        'toulouse': {lat: 43.6047, lng: 1.4442},
        'nice': {lat: 43.7102, lng: 7.2620},
        'nantes': {lat: 47.2184, lng: -1.5536},
        'strasbourg': {lat: 48.5734, lng: 7.7521},
        'montpellier': {lat: 43.6110, lng: 3.8767},
        'bordeaux': {lat: 44.8378, lng: -0.5792},
        'lille': {lat: 50.6292, lng: 3.0573}
      };
      
      const cityName = location.toLowerCase().split(',')[0].trim();
      return cityCoords[cityName] || null;
    }

    console.log('Found enhanced providers:', validProviders.length, 'with advanced scoring');

    // Métriques avancées pour le client
    const analytics = {
      search_quality: validProviders.length > 0 ? validProviders[0].advanced_score : 0,
      avg_distance: validProviders.filter(p => p.distance).reduce((acc, p) => acc + (p.distance || 0), 0) / Math.max(1, validProviders.filter(p => p.distance).length),
      urgent_available: validProviders.filter(p => p.urgent_available).length,
      competition_level: demandMetrics.service_demand > 5 ? 'high' : demandMetrics.service_demand > 2 ? 'medium' : 'low'
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        providers: validProviders,
        demand_metrics: demandMetrics,
        analytics,
        total_matches: validProviders.length,
        search_criteria: { serviceType, location, urgency, hasGeoLocation: !!(latitude && longitude) },
        recommendations: validProviders.filter(p => p.recommended).slice(0, 3)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Provider matching error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to match providers',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});