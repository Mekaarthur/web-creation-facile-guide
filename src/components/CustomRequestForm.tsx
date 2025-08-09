import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare } from "lucide-react";

const CustomRequestForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_description: "",
    preferred_date: "",
    preferred_time: "",
    budget_range: "",
    location: "",
    urgency_level: "normal",
    additional_notes: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_email || !formData.service_description || !formData.location) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('custom_requests')
        .insert([formData]);

      if (error) {
        throw error;
      }

      toast({
        title: "Demande envoyée !",
        description: "Votre demande personnalisée a été envoyée avec succès. Nous vous recontacterons rapidement."
      });

      // Reset form
      setFormData({
        client_name: "",
        client_email: "",
        client_phone: "",
        service_description: "",
        preferred_date: "",
        preferred_time: "",
        budget_range: "",
        location: "",
        urgency_level: "normal",
        additional_notes: ""
      });

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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date souhaitée</label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Heure préférée</label>
              <Input
                value={formData.preferred_time}
                onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                placeholder="Ex: 14h00"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Localisation <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Ville ou adresse"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Budget souhaité</label>
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