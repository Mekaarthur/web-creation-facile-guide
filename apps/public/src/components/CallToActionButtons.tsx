import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, MessageCircle, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CallToActionButtonsProps {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showLabels?: boolean;
}

const CallToActionButtons = ({ 
  size = "default", 
  variant = "default", 
  className = "",
  showLabels = true 
}: CallToActionButtonsProps) => {
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePhoneClick = () => {
    setIsPhoneModalOpen(true);
  };

  const handleMessageClick = () => {
    const subject = encodeURIComponent("Demande d'information - Services Bikawo");
    const body = encodeURIComponent(`Bonjour,

Je souhaite obtenir des informations concernant vos services.

Cordialement,`);
    
    window.location.href = `mailto:contact@bikawo.com?subject=${subject}&body=${body}`;
    
    toast({
      title: "Redirection vers votre client email",
      description: "Votre client email va s'ouvrir avec un message pré-rempli",
    });
  };

  const handleDevisClick = () => {
    navigate('/custom-request');
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText("0609085390").then(() => {
      toast({
        title: "Numéro copié !",
        description: "Le numéro de téléphone a été copié dans votre presse-papiers",
      });
    }).catch(() => {
      toast({
        title: "Erreur",
        description: "Impossible de copier le numéro. Veuillez le noter : 0609085390",
        variant: "destructive",
      });
    });
  };

  return (
    <>
      <div className={`flex gap-3 ${className}`}>
        <Button 
          size={size} 
          variant={variant}
          onClick={handlePhoneClick}
          className="flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          {showLabels && "Appeler"}
        </Button>
        
        <Button 
          size={size} 
          variant="outline"
          onClick={handleMessageClick}
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {showLabels && "Message"}
        </Button>
        
        <Button 
          size={size} 
          variant="secondary"
          onClick={handleDevisClick}
          className="flex items-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          {showLabels && "Devis"}
        </Button>
      </div>

      {/* Modal téléphone */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contactez-nous par téléphone
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg p-6">
                <div className="text-2xl font-bold text-primary mb-2">
                  0609085390
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Disponible 7j/7 de 8h à 20h
                </p>
                <Button 
                  onClick={copyPhoneNumber}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Copier le numéro
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📞 <strong>Urgences :</strong> Disponible 24h/24</p>
              <p>💬 <strong>Conseils :</strong> Gratuits et sans engagement</p>
              <p>⚡ <strong>Réactivité :</strong> Réponse immédiate</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Astuce :</strong> Pour une réponse plus rapide, vous pouvez également nous envoyer un message via WhatsApp au même numéro.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallToActionButtons;