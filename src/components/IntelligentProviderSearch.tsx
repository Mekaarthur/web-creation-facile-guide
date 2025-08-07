import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Clock, Star, Target, Brain, Zap } from 'lucide-react';
import { useIntelligentMatching } from '@/hooks/useIntelligentMatching';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { AnimatedCard } from '@/components/ui/animated-card';
import { useToast } from '@/hooks/use-toast';

interface IntelligentProviderSearchProps {
  onProviderSelect?: (provider: any) => void;
  initialServiceType?: string;
  initialLocation?: string;
}

export const IntelligentProviderSearch: React.FC<IntelligentProviderSearchProps> = ({
  onProviderSelect,
  initialServiceType = '',
  initialLocation = ''
}) => {
  const [serviceType, setServiceType] = useState(initialServiceType);
  const [location, setLocation] = useState(initialLocation);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [minRating, setMinRating] = useState([3]);
  const [maxPrice, setMaxPrice] = useState([100]);
  const [useGeolocation, setUseGeolocation] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const { 
    loading, 
    results, 
    error, 
    matchingQuality, 
    findIntelligentMatches, 
    getSuggestions,
    getSmartFilters,
    hasGeolocation 
  } = useIntelligentMatching();

  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de recherche",
        description: error
      });
    }
  }, [error, toast]);

  const handleSearch = async () => {
    if (!serviceType.trim() || !location.trim()) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir le type de service et la localisation"
      });
      return;
    }

    await findIntelligentMatches({
      serviceType,
      location,
      urgency,
      minRating: minRating[0],
      maxPrice: maxPrice[0],
      useGeolocation
    });
  };

  const loadSuggestions = async () => {
    if (serviceType.length > 2) {
      const suggestionsList = await getSuggestions(serviceType);
      setSuggestions(suggestionsList);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [serviceType]);

  const getUrgencyColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const smartFilters = getSmartFilters();

  return (
    <div className="space-y-6">
      {/* Formulaire de recherche intelligente */}
      <AnimatedCard className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Recherche Intelligente de Prestataires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type de service</label>
              <Input
                placeholder="Ex: Ménage, Jardinage, Garde d'enfants..."
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full"
              />
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="cursor-pointer text-xs"
                      onClick={() => setServiceType(suggestion.service_type)}
                    >
                      {suggestion.service_type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Localisation</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ville, département..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                />
                {hasGeolocation && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUseGeolocation(!useGeolocation)}
                    className={useGeolocation ? 'bg-primary text-white' : ''}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Urgence</label>
              <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Pas pressé</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Assez urgent</SelectItem>
                  <SelectItem value="urgent">Très urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Note minimum: {minRating[0]}/5
              </label>
              <Slider
                value={minRating}
                onValueChange={setMinRating}
                max={5}
                min={1}
                step={0.5}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Prix max: {maxPrice[0]}€/h
              </label>
              <Slider
                value={maxPrice}
                onValueChange={setMaxPrice}
                max={200}
                min={10}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recherche intelligente...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Lancer la recherche intelligente
              </div>
            )}
          </Button>
        </CardContent>
      </AnimatedCard>

      {/* Filtres intelligents */}
      {smartFilters.length > 0 && (
        <AnimatedCard className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              Suggestions d'amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {smartFilters.map((filter, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer">
                  {filter.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Qualité du matching */}
      {matchingQuality && (
        <AnimatedCard className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              Qualité de la recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(matchingQuality.score)}%
                </div>
                <div className="text-xs text-muted-foreground">Score qualité</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {matchingQuality.providersFound}
                </div>
                <div className="text-xs text-muted-foreground">Prestataires trouvés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {matchingQuality.avgDistance ? `${Math.round(matchingQuality.avgDistance)}km` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Distance moyenne</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  matchingQuality.competitionLevel === 'low' ? 'text-green-500' :
                  matchingQuality.competitionLevel === 'medium' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {matchingQuality.competitionLevel}
                </div>
                <div className="text-xs text-muted-foreground">Concurrence</div>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Résultats */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {results && !loading && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {results.providers.length} prestataire(s) trouvé(s)
          </h3>
          
          {/* Recommandations */}
          {results.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Recommandations
              </h4>
              <div className="grid gap-4">
                {results.recommendations.map((provider) => (
                  <AnimatedCard 
                    key={provider.provider_id} 
                    className="border-primary/20 bg-primary/5 animate-scale-in"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold">{provider.business_name}</h5>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {provider.rating}/5
                            </div>
                            {provider.distance && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {Math.round(provider.distance)}km
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <Badge className={getUrgencyColor('recommended')}>
                              Recommandé
                            </Badge>
                            {provider.urgent_available && (
                              <Badge variant="outline" className="ml-2">
                                <Clock className="h-3 w-3 mr-1" />
                                Disponible rapidement
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {provider.hourly_rate}€/h
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => onProviderSelect?.(provider)}
                          >
                            Choisir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          )}

          {/* Tous les prestataires */}
          <div className="grid gap-4">
            {results.providers.map((provider) => (
              <AnimatedCard 
                key={provider.provider_id}
                className="animate-fade-in-up hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-semibold">{provider.business_name}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.location}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {provider.rating}/5
                        </div>
                        {provider.distance && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {Math.round(provider.distance)}km
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Score: {Math.round(provider.advanced_score)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {provider.hourly_rate}€/h
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onProviderSelect?.(provider)}
                      >
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};