import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, Euro, User, Mail, Phone, Building, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/components/Cart";

interface ServiceReservationFormProps {
  service: {
    name: string;
    description?: string;
    price: number;
    category?: string;
  };
  packageTitle: string;
  onClose: () => void;
}

const ServiceReservationForm = ({ service, packageTitle, onClose }: ServiceReservationFormProps) => {
  // Informations client
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: ""
  });

  // Détails de la prestation
  const [reservationDetails, setReservationDetails] = useState({
    serviceType: "",
    description: "",
    preferredDate: null as Date | null,
    budget: "",
    address: ""
  });

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Options de types de prestations selon le service
  const getServiceTypeOptions = () => {
    const baseOptions = [
      "Prestation ponctuelle",
      "Prestation récurrente",
      "Prestation d'urgence"
    ];

    // Ajouter des options spécifiques selon le service
    if (service.category === "enfants") {
      return [...baseOptions, "Garde d'enfants", "Aide aux devoirs", "Sorties éducatives"];
    } else if (service.category === "maison") {
      return [...baseOptions, "Préparation culinaire / batch cooking", "Jardinage", "Bricolage", "Déménagement"];
    } else if (service.category === "seniors") {
      return [...baseOptions, "Accompagnement", "Aide à domicile", "Courses"];
    }
    
    return baseOptions;
  };

  const budgetRanges = [
    "Moins de 50€",
    "50€ - 100€",
    "100€ - 200€",
    "200€ - 500€",
    "Plus de 500€",
    "À définir ensemble"
  ];

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || !clientInfo.phone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires (nom, prénom, email, téléphone)",
        variant: "destructive",
      });
      return;
    }

    if (!reservationDetails.serviceType || !reservationDetails.description || !reservationDetails.address) {
      toast({
        title: "Détails manquants",
        description: "Veuillez préciser le type de prestation, la description et l'adresse",
        variant: "destructive",
      });
      return;
    }

    if (!reservationDetails.preferredDate) {
      toast({
        title: "Date manquante",
        description: "Veuillez sélectionner une date souhaitée",
        variant: "destructive",
      });
      return;
    }

    // Ajouter au panier avec toutes les informations
    addToCart({
      serviceName: service.name,
      packageTitle,
      price: service.price,
      description: service.description,
        customBooking: {
          date: reservationDetails.preferredDate,
          time: "À définir",
          hours: 2, // Durée minimum 2h
          address: reservationDetails.address,
          notes: reservationDetails.description,
          clientInfo,
          serviceType: reservationDetails.serviceType,
          budget: reservationDetails.budget
        }
    });

    // Sauvegarder la demande en base (simulation avec localStorage pour le moment)
    const reservationData = {
      id: `reservation-${Date.now()}`,
      service: service.name,
      packageTitle,
      clientInfo,
      reservationDetails,
      status: "nouvelle",
      createdAt: new Date().toISOString(),
      estimatedPrice: service.price
    };

    const existingReservations = localStorage.getItem('bikawo-reservations') || '[]';
    const reservations = JSON.parse(existingReservations);
    reservations.push(reservationData);
    localStorage.setItem('bikawo-reservations', JSON.stringify(reservations));

    toast({
      title: "Demande de réservation enregistrée",
      description: `Votre demande pour ${service.name} a été ajoutée au panier et sauvegardée`,
    });

    onClose();
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Service Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{service.name}</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Euro className="w-3 h-3" />
              À partir de {service.price}€
            </Badge>
          </CardTitle>
          {service.description && (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Informations Client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Vos informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                placeholder="Votre prénom"
                value={clientInfo.firstName}
                onChange={(e) => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                placeholder="Votre nom"
                value={clientInfo.lastName}
                onChange={(e) => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={clientInfo.email}
                onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01 23 45 67 89"
                value={clientInfo.phone}
                onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Entreprise (optionnel)
            </Label>
            <Input
              id="company"
              placeholder="Nom de votre entreprise"
              value={clientInfo.company}
              onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Détails de la Prestation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Détails de votre demande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceType">Type de prestation souhaitée *</Label>
            <Select 
              value={reservationDetails.serviceType}
              onValueChange={(value) => setReservationDetails(prev => ({ ...prev, serviceType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de prestation" />
              </SelectTrigger>
              <SelectContent>
                {getServiceTypeOptions().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du besoin / message *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez en détail votre besoin, vos attentes, contraintes particulières..."
              value={reservationDetails.description}
              onChange={(e) => setReservationDetails(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date souhaitée pour le début *</Label>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reservationDetails.preferredDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reservationDetails.preferredDate 
                      ? format(reservationDetails.preferredDate, "PPP", { locale: fr }) 
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reservationDetails.preferredDate}
                    onSelect={(date) => {
                      setReservationDetails(prev => ({ ...prev, preferredDate: date }));
                      setIsDatePopoverOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget estimé (optionnel)</Label>
              <Select 
                value={reservationDetails.budget}
                onValueChange={(value) => setReservationDetails(prev => ({ ...prev, budget: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse précise complète *
            </Label>
            <Input
              id="address"
              placeholder="Numéro, rue, code postal, ville"
              value={reservationDetails.address}
              onChange={(e) => setReservationDetails(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Ajouter au panier
        </Button>
      </div>
    </div>
  );
};

export default ServiceReservationForm;