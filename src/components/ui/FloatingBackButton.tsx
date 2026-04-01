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
        "fixed bottom-20 left-4 z-50 rounded-full shadow-lg",
        "bg-background/95 backdrop-blur-sm border-border/50",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
        "transition-all duration-200 hover:scale-105",
        "h-12 w-12 md:h-11 md:w-11",
        "print:hidden"
      )}
      aria-label="Retour à la page précédente"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};
