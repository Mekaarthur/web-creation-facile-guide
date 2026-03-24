import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FloatingBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on homepage
  if (location.pathname === "/") return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => navigate(-1)}
      className={cn(
        "fixed bottom-6 left-6 z-40 rounded-full shadow-lg",
        "bg-background/90 backdrop-blur-sm border-border/50",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
        "transition-all duration-200 hover:scale-105",
        "h-11 w-11 md:h-10 md:w-10"
      )}
      aria-label="Retour à la page précédente"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};
