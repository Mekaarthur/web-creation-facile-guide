import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, MapPin, ShoppingCart, ArrowRight, Shield, Plus, AlertCircle, CheckCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useBikawoCart } from "@/hooks/useBikawoCart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSecureForm } from "@/hooks/useSecureForm";
import { bookingSchema } from "@/lib/security-validation";
import { z } from "zod";
import { useProviderZoneCheck } from "@/hooks/useProviderZoneCheck";

interface BikaServiceBookingProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    name: string;
    description: string;
    price: number;
    category: string;
    options?: string[];
    financialCategory: string;
    urssaf_eligible: boolean;
  };
  packageTitle: string;
}

const BikaServiceBooking = ({ isOpen, onClose, service, packageTitle }: BikaServiceBookingProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);

  const zoneCheck = useProviderZoneCheck(postalCode);
  
  const { addToCart } = useBikawoCart();
  const { toast } = useToast();

  // Secure form validation
  const { handleSubmit: secureSubmit, isSubmitting, errors } = useSecureForm({
    schema: bookingSchema,
    onSubmit: async (validatedData) => {
      // Data is already validated by schema
      executeAddToCart(validatedData);
    },
    rateLimitKey: 'booking',
    rateLimitAction: 'add_to_cart'
  });

  const availableTimeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinutes = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinutes = parseInt(endTime.split(':')[1]);
    return (endHour + endMinutes/60) - (startHour + startMinutes/60);
  };

  const getTotalPrice = () => {
    return calculateDuration() * service.price;
  };

  const handleAddToCart = () => {
    if (!date || !startTime || !endTime || !address || !postalCode) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis, y compris le code postal",
        variant: "destructive",
      });
      return;
    }

    // R-SEL-02 / R-SEL-04 : bloquer si aucun prestataire dans la zone
    if (zoneCheck.data && !zoneCheck.data.available) {
      toast({
        title: "Zone non couverte",
        description: "Aucun prestataire disponible dans votre secteur pour le moment.",
        variant: "destructive",
      });
      return;
    }

    if (service.options && service.options.length > 0 && !selectedOption) {
      toast({
        title: "Prestation non sélectionnée",
        description: "Veuillez sélectionner une prestation parmi les options disponibles",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Erreur d'horaires",
        description: "L'heure de fin doit être postérieure à l'heure de début",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration();
    if (duration < 2) {
      toast({
        title: "Durée insuffisante",
        description: "Durée minimum : 2 heures par service",
        variant: "destructive",
      });
      return;
    }

    // Validate with secure form
    secureSubmit({
      date: date.toISOString(),
      startTime: startTime,
      address: address,
      postalCode: postalCode || "00000",
      notes: notes || undefined
    });
  };

  const executeAddToCart = (validatedData: z.infer<typeof bookingSchema>) => {
    const duration = calculateDuration();
    
    // Construire la description avec l'option sélectionnée
    const optionText = selectedOption ? ` - ${selectedOption}` : '';
    const description = `${format(date!, "dd/MM/yyyy", { locale: fr })} de ${startTime} à ${endTime} (${duration}h)${optionText}`;
    
    // Adapter au format BikawoCartItem
    addToCart({
      serviceName: service.name,
      serviceCategory: service.category as any,
      packageTitle: packageTitle,
      price: service.price,
      quantity: duration, // Durée en heures
      timeSlot: {
        date: date!,
        startTime: startTime,
        endTime: endTime
      },
      address: validatedData.address,
      description: description,
      notes: validatedData.notes,
      financialCategory: service.financialCategory,
      urssaf_eligible: service.urssaf_eligible,
    });

    // Utiliser setTimeout pour éviter les updates pendant le render
    setTimeout(() => {
      toast({
        title: "✅ Service ajouté au panier",
        description: `${service.name} - ${duration}h pour ${getTotalPrice()}€`,
        duration: 5000,
      });

      // Animer l'icône du panier
      const cartButton = document.querySelector('[data-cart-indicator]');
      if (cartButton) {
        cartButton.classList.add('animate-bounce');
        setTimeout(() => cartButton.classList.remove('animate-bounce'), 1000);
      }
    }, 0);

    // Montrer les options après ajout
    setShowSuccessOptions(true);
  };

  const handleAddAnother = () => {
    // Reset form pour ajouter un autre créneau
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setAddress("");
    setPostalCode("");
    setNotes("");
    setSelectedOption("");
    setShowSuccessOptions(false);
    toast({
      title: "Prêt pour un nouveau créneau",
      description: "Configurez votre prochain créneau",
    });
  };

  const handleGoToCart = () => {
    onClose();
    navigate("/panier");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Réserver - {service.name}
            <Badge variant="outline" className="ml-2">
              <Shield className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {showSuccessOptions 
              ? "Créneau ajouté ! Que souhaitez-vous faire ?"
              : "Choisissez votre date, horaires et adresse d'intervention"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {showSuccessOptions ? (
            /* Options après ajout au panier */
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Créneau ajouté au panier !</h3>
              <p className="text-muted-foreground">
                {service.name} - {calculateDuration()}h pour {getTotalPrice()}€
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleAddAnother} size="lg" variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un autre créneau
                </Button>
                <Button onClick={handleGoToCart} size="lg" className="w-full bg-gradient-primary">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Procéder au paiement
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Service Info — R-SEL-01: mention crédit d'impôt */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-primary border-primary">
                      {service.price}€/h
                    </Badge>
                    {service.urssaf_eligible && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        → {(service.price * 0.5).toFixed(2)}€/h réel*
                      </p>
                    )}
                  </div>
                </div>
                {service.urssaf_eligible && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3 text-green-600 shrink-0" />
                    *Prix après crédit d'impôt de 50% (art. 199 sexdecies CGI)
                  </p>
                )}
              </div>

              {/* Sélection de la prestation (si options disponibles) */}
              {service.options && service.options.length > 0 && (
                <div className="space-y-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <Label className="text-base font-semibold text-primary">
                    Prestation souhaitée * (1 seul choix)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sélectionnez UNE prestation parmi les options disponibles :
                  </p>
                  <div className="space-y-2">
                    {service.options.map((option) => (
                      <label 
                        key={option}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                          selectedOption === option 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="service-option"
                          value={option}
                          checked={selectedOption === option}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          className="mt-1"
                        />
                        <span className="text-sm flex-1">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulaire simplifié - Un seul créneau */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Date et horaires (minimum 2h)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd/MM/yyyy", { locale: fr }) : "Choisir une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Heure début *</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Début" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Heure fin *</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Aperçu durée et prix — R-SEL-03 décomposition tarifaire */}
                {date && startTime && endTime && calculateDuration() > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          Durée : {calculateDuration()}h
                        </span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {getTotalPrice()}€
                      </span>
                    </div>
                    {service.urssaf_eligible && (
                      <div className="border-t border-primary/10 pt-2 text-xs space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Prix total</span>
                          <span className="font-medium text-foreground">{getTotalPrice().toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-green-700">
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Crédit d'impôt (50%)
                          </span>
                          <span className="font-medium">−{(getTotalPrice() * 0.5).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between font-semibold text-green-800 text-sm">
                          <span>Votre coût réel</span>
                          <span>{(getTotalPrice() * 0.5).toFixed(2)}€</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Code postal + zone check */}
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Code postal d'intervention *
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="Ex: 75001"
                    maxLength={5}
                    className="w-36"
                  />
                  {zoneCheck.isLoading && (
                    <span className="text-xs text-muted-foreground">Vérification...</span>
                  )}
                  {zoneCheck.data?.available && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {zoneCheck.data.count} prestataire{zoneCheck.data.count > 1 ? 's' : ''} disponible{zoneCheck.data.count > 1 ? 's' : ''}
                    </span>
                  )}
                  {zoneCheck.data && !zoneCheck.data.available && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Service disponible prochainement dans votre secteur
                    </span>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  Adresse complète *
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 15 rue de la Paix, 75001 Paris"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires, instructions spéciales..."
                  rows={3}
                  maxLength={1000}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {notes.length}/1000 caractères
                </p>
              </div>
            </>
          )}
        </div>

        {!showSuccessOptions && (
          <div className="space-y-3">
            {/* R-SEL-04: message zone non couverte */}
            {zoneCheck.data && !zoneCheck.data.available && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Service disponible prochainement dans votre secteur</p>
                  <p className="text-xs mt-0.5">Nous étendons notre réseau de prestataires. Revenez prochainement ou contactez-nous au 06 09 08 53 90.</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-primary"
                disabled={!date || !startTime || !endTime || !address || !postalCode || isSubmitting}
              >
                {isSubmitting ? "Ajout en cours..." : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BikaServiceBooking;
