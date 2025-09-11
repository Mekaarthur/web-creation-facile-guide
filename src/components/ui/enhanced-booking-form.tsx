import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ValidatedForm, FormFieldConfig } from './validated-form';
import { bookingSchema, BookingForm } from '@/lib/validations';

interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  category: string;
}

interface EnhancedBookingFormProps {
  services?: Service[];
  onSubmit: (data: BookingForm) => Promise<void>;
  loading?: boolean;
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Normale', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Urgente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Très urgente', color: 'bg-red-100 text-red-800' },
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const EnhancedBookingForm: React.FC<EnhancedBookingFormProps> = ({
  services = [],
  onSubmit,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [formData, setFormData] = useState<Partial<BookingForm>>({});
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    setFormData(prev => ({ ...prev, serviceId }));
  };

  const calculatePrice = (startTime: string, endTime: string, hourlyRate: number) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    if (end <= start) return 0;
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * hourlyRate * 100) / 100;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (newFormData.startTime && newFormData.endTime && selectedService) {
      const price = calculatePrice(
        newFormData.startTime,
        newFormData.endTime,
        selectedService.price_per_hour
      );
      setEstimatedPrice(price);
    }
    
    setFormData(newFormData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Choisir un service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez le service dont vous avez besoin
              </p>
            </div>
            
            <div className="grid gap-3">
              {services.map((service) => (
                <Card 
                  key={service.id}
                  className={`cursor-pointer transition-colors ${
                    selectedService?.id === service.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium text-foreground">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <Badge variant="secondary">{service.category}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-foreground">
                          {service.price_per_hour}€/h
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Date et horaires</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choisissez quand vous souhaitez le service
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure de début
                </label>
                <Select onValueChange={(value) => handleTimeChange('startTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Heure de début" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure de fin
                </label>
                <Select onValueChange={(value) => handleTimeChange('endTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Heure de fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {estimatedPrice > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Prix estimé:</span>
                    <span className="text-xl font-bold text-primary">{estimatedPrice}€</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Détails de la mission</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Précisez les détails de votre demande
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </label>
                <Input
                  placeholder="Adresse complète du service"
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Décrivez précisément ce que vous attendez du service..."
                  rows={4}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Urgence
                </label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value as 'low' | 'medium' | 'high' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau d'urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${option.color}`}>
                            {option.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Récapitulatif</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vérifiez les informations avant de confirmer
              </p>
            </div>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-foreground">{selectedService?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">
                    {formData.date?.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horaires:</span>
                  <span className="font-medium text-foreground">
                    {formData.startTime} - {formData.endTime}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lieu:</span>
                  <span className="font-medium text-foreground">{formData.location}</span>
                </div>
                
                {formData.urgency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Urgence:</span>
                    <Badge variant="secondary">
                      {URGENCY_OPTIONS.find(o => o.value === formData.urgency)?.label}
                    </Badge>
                  </div>
                )}
                
                <hr />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Prix estimé:</span>
                  <span className="text-primary">{estimatedPrice}€</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!selectedService;
      case 2:
        return !!(formData.date && formData.startTime && formData.endTime);
      case 3:
        return !!(formData.location && formData.description);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !formData.date || !formData.startTime || !formData.endTime || 
        !formData.location || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const bookingData: BookingForm = {
      serviceId: selectedService.id,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      description: formData.description,
      urgency: formData.urgency || 'low',
    };

    await onSubmit(bookingData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nouvelle réservation
        </CardTitle>
        <CardDescription>
          Étape {currentStep} sur {totalSteps}
        </CardDescription>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStepContent()}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Précédent
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNext()}
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceedToNext()}
            >
              {loading && <CreditCard className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la réservation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};