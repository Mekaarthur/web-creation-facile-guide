import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, RefreshCw, Compass } from "lucide-react";
import { useServiceRecommendations, type Recommendation } from "@/hooks/useServiceRecommendations";

const TYPE_CONFIG = {
  rebook: {
    label: "À re-planifier",
    Icon: RefreshCw,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  complement: {
    label: "Complément idéal",
    Icon: Sparkles,
    badgeClass: "bg-secondary/10 text-secondary-foreground border-secondary/30",
  },
  discover: {
    label: "À découvrir",
    Icon: Compass,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
} as const;

const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[rec.type];
  const { Icon } = config;

  return (
    <div
      className={`min-w-[200px] sm:min-w-[230px] flex-shrink-0 snap-start rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${rec.bgClass} ${rec.colorClass.replace("text-", "border-").replace("600", "200")}`}
      onClick={() => navigate(rec.route)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(rec.route)}
      aria-label={`Découvrir ${rec.universeName}`}
    >
      {/* Header : emoji + badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl leading-none">{rec.emoji}</span>
        <Badge className={`text-[10px] gap-1 py-0.5 px-1.5 flex-shrink-0 ${config.badgeClass} border`}>
          <Icon className="w-2.5 h-2.5" />
          {config.label}
        </Badge>
      </div>

      {/* Nom + description */}
      <div className="flex-1">
        <h4 className={`font-bold text-sm sm:text-base ${rec.colorClass}`}>
          {rec.universeName}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {rec.universeDescription}
        </p>
      </div>

      {/* Raison personnalisée */}
      <p className="text-[11px] text-muted-foreground italic border-t border-current/10 pt-2">
        {rec.reason}
        {rec.bookingCount && rec.bookingCount > 1 && (
          <span className="ml-1 not-italic font-medium">
            · {rec.bookingCount} réservation{rec.bookingCount > 1 ? "s" : ""}
          </span>
        )}
      </p>

      {/* CTA */}
      <Button
        size="sm"
        variant="ghost"
        className={`w-full justify-between group hover:opacity-90 px-3 h-8 ${rec.colorClass} hover:${rec.bgClass}`}
        onClick={(e) => {
          e.stopPropagation();
          navigate(rec.route);
        }}
      >
        <span className="text-xs font-semibold">Réserver</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </div>
  );
};

const ServiceRecommendations = () => {
  const { recommendations, isLoading } = useServiceRecommendations();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted/60 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-muted/60 rounded animate-pulse" />
              <div className="h-3 w-36 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[200px] h-44 bg-muted/40 rounded-2xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) return null;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-warning/20 to-orange-200/40 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
          <div>
            <span className="text-lg sm:text-xl">Recommandé pour vous</span>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
              Basé sur vos habitudes et préférences
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1 opacity-60">
          Glissez pour voir plus →
        </p>
      </CardContent>
    </Card>
  );
};

export default ServiceRecommendations;
