import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useProviderMatching } from "@/hooks/useProviderMatching";
import { BookingFormDialog } from "@/components/booking/BookingFormDialog";

const ServicesBooking = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBookingInterface, setShowBookingInterface] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const { loading, findMatchingProviders } = useProviderMatching();

  useEffect(() => {
    findMatchingProviders();

    const handleServiceSelection = (event: any) => {
      const serviceData = event.detail;
      setSelectedService(serviceData);
      setShowBookingInterface(true);
      setIsBookingDialogOpen(true);
      findMatchingProviders({ serviceId: serviceData.id, minRating: minRating || undefined, maxPrice: maxPrice || undefined, dateTime: undefined });
    };

    window.addEventListener('selectService', handleServiceSelection);
    return () => { window.removeEventListener('selectService', handleServiceSelection); };
  }, [minRating, maxPrice]);

  const handleFiltersChange = () => {
    if (selectedService) {
      findMatchingProviders({ serviceId: selectedService.id, minRating: minRating || undefined, maxPrice: maxPrice || undefined, dateTime: undefined });
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
              </div>
            </div>
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-semibold">Chargement des services</h3>
              <p className="text-muted-foreground">Recherche des meilleurs prestataires...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showBookingInterface) return null;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Star className="w-4 h-4" />
            <span>Réserver un service</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Finaliser votre réservation
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              {selectedService?.name} - {selectedService?.package}
            </span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <BookingFormDialog
            open={isBookingDialogOpen}
            selectedService={selectedService}
            minRating={minRating}
            maxPrice={maxPrice}
            onMinRatingChange={setMinRating}
            onMaxPriceChange={setMaxPrice}
            onFiltersChange={handleFiltersChange}
            onClose={() => { setIsBookingDialogOpen(false); setShowBookingInterface(false); }}
            onSuccess={() => { setIsBookingDialogOpen(false); setShowBookingInterface(false); setSelectedService(null); }}
          />
        </div>
      </div>
    </section>
  );
};

export default ServicesBooking;
