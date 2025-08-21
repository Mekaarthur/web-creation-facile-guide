import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CustomRequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [hasDelivery, setHasDelivery] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_description: "",
    preferred_datetime: "",
    pickup_address: "",
    delivery_address: "",
    budget_range: "",
    urgency_level: "normal",
    additional_notes: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_email || !formData.service_description || !formData.pickup_address) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare datetime if both date and time are provided
      let preferredDatetime = null;
      if (selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        const datetime = new Date(selectedDate);
        datetime.setHours(parseInt(hours), parseInt(minutes));
        preferredDatetime = datetime.toISOString();
      }

      // Construire le payload pour custom_requests (RLS: insertion publique autorisée)
      const preferredDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
      const payload = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone || null,
        service_description: formData.service_description,
        location: formData.pickup_address,
        preferred_date: preferredDateStr,
        preferred_time: selectedTime || null,
        preferred_datetime: preferredDatetime,
        budget_range: formData.budget_range || null,
        urgency_level: formData.urgency_level || 'normal',
        additional_notes: formData.additional_notes || null,
        pickup_address: formData.pickup_address,
        delivery_address: formData.delivery_address || null,
        status: 'new'
      };

      // Sauvegarder la demande
      const { data: created, error } = await supabase
        .from('custom_requests')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Emails: confirmation client et notification admin
      const bookingDetails = {
        id: created?.id || 'pending',
        serviceName: 'Demande personnalisée',
        date: preferredDateStr || new Date().toISOString(),
        time: selectedTime || '',
        location: formData.pickup_address,
        price: 0
      };

      // Essayer d'envoyer les emails (ne bloque pas la réussite de la demande)
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'booking_confirmation',
            recipientEmail: formData.client_email,
            recipientName: formData.client_name,
            bookingDetails
          }
        });
      } catch (e) {
        console.error('Erreur envoi email client:', e);
      }

      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: 'admin@bikawo.com',
            type: 'booking_request',
            data: {
              clientName: formData.client_name,
              serviceName: 'Demande personnalisée',
              bookingDate: preferredDateStr || '',
              bookingTime: selectedTime || '',
              location: formData.pickup_address,
              price: 0,
              bookingId: created?.id,
              message: formData.service_description
            }
          }
        });
      } catch (e) {
        console.error('Erreur notification admin:', e);
      }

      toast({
        title: "Demande envoyée !",
        description: "Votre demande a bien été enregistrée. Un email de confirmation vous a été envoyé."
      });

      // Reset form
      setFormData({
        client_name: "",
        client_email: "",
        client_phone: "",
        service_description: "",
        preferred_datetime: "",
        pickup_address: "",
        delivery_address: "",
        budget_range: "",
        urgency_level: "normal",
        additional_notes: ""
      });
      setSelectedDate(undefined);
      setSelectedTime("");
      setHasDelivery(false);

    } catch (error) {
      console.error('Error submitting custom request:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Demande personnalisée</CardTitle>
            <p className="text-muted-foreground">
              Décrivez-nous vos besoins spécifiques et nous vous proposerons une solution sur mesure
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom complet <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                placeholder="Votre nom complet"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
            <Input
              value={formData.client_phone}
              onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description du service souhaité <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={formData.service_description}
              onChange={(e) => setFormData({...formData, service_description: e.target.value})}
              placeholder="Décrivez en détail le service que vous recherchez..."
              rows={4}
              required
            />
          </div>

          {/* Date et heure souhaitées */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Date souhaitée
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Heure souhaitée
              </Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                placeholder="Ex: 14:00"
              />
            </div>
          </div>

          {/* Adresse de départ/récupération */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Adresse de départ / récupération <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.pickup_address}
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                placeholder="Adresse complète de départ"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Option livraison/destination */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDelivery"
                checked={hasDelivery}
                onCheckedChange={(checked) => setHasDelivery(checked === true)}
              />
              <Label
                htmlFor="hasDelivery"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Service avec livraison ou destination différente
              </Label>
            </div>

            {hasDelivery && (
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Adresse de livraison / lieu de destination
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    placeholder="Adresse complète de livraison"
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Budget souhaité</Label>
            <Select
              value={formData.budget_range}
              onValueChange={(value) => setFormData({...formData, budget_range: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20-50">20€ - 50€</SelectItem>
                <SelectItem value="50-100">50€ - 100€</SelectItem>
                <SelectItem value="100-200">100€ - 200€</SelectItem>
                <SelectItem value="200-500">200€ - 500€</SelectItem>
                <SelectItem value="500+">500€+</SelectItem>
                <SelectItem value="à discuter">À discuter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Urgence</label>
            <Select
              value={formData.urgency_level}
              onValueChange={(value) => setFormData({...formData, urgency_level: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Pas pressé</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Urgent</SelectItem>
                <SelectItem value="very_high">Très urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes supplémentaires</label>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              placeholder="Informations complémentaires, contraintes particulières..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Envoyer ma demande
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            En envoyant cette demande, vous acceptez d'être contacté par notre équipe pour discuter de votre projet.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomRequestForm;