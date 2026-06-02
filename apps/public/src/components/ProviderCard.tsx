import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, CheckCircle, Shield } from "lucide-react";
import type { Provider } from "@/types/provider";

interface ProviderCardProps {
  provider: Provider;
  onSelect: (provider: Provider) => void;
  selectedServiceId?: string;
  isSelected?: boolean;
}

export const ProviderCard = ({ provider, onSelect, selectedServiceId, isSelected }: ProviderCardProps) => {
  const getDisplayName = () => {
    if (provider.business_name) return provider.business_name;
    if (provider.profiles?.first_name || provider.profiles?.last_name) {
      return `${provider.profiles.first_name || ''} ${provider.profiles.last_name || ''}`.trim();
    }
    return 'Prestataire';
  };

  const getPrice = () => {
    if (selectedServiceId) {
      const providerService = provider.provider_services?.find(ps => ps.service_id === selectedServiceId);
      return providerService?.price_override || provider.hourly_rate || 0;
    }
    return provider.hourly_rate || 0;
  };

  const hasVerifiedDocuments = () => {
    return provider.provider_documents?.some(doc => doc.is_verified) || false;
  };

  const getAvailabilityStatus = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayAvailability = provider.provider_availability?.find(
      avail => avail.day_of_week === currentDay && avail.is_available
    );
    
    if (todayAvailability) {
      if (currentTime >= todayAvailability.start_time && currentTime <= todayAvailability.end_time) {
        return { status: 'available', text: 'Disponible maintenant' };
      } else {
        return { status: 'later', text: `Disponible de ${todayAvailability.start_time} à ${todayAvailability.end_time}` };
      }
    }
    
    return { status: 'unavailable', text: 'Non disponible aujourd\'hui' };
  };

  const availability = getAvailabilityStatus();

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
    }`} onClick={() => onSelect(provider)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={provider.profiles?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10">
                {getDisplayName().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-none">{getDisplayName()}</h3>
              <div className="flex items-center mt-1 space-x-2">
                {provider.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
                {hasVerifiedDocuments() && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Certifié
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{getPrice()}€/h</div>
            {provider.rating && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                {provider.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {provider.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {provider.description}
          </p>
        )}
        
        <div className="space-y-2">
          {provider.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              {provider.location}
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span className={`
              ${availability.status === 'available' ? 'text-green-600' : 
                availability.status === 'later' ? 'text-orange-600' : 'text-red-600'}
            `}>
              {availability.text}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            variant={isSelected ? "default" : "outline"} 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(provider);
            }}
          >
            {isSelected ? 'Sélectionné' : 'Sélectionner'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};