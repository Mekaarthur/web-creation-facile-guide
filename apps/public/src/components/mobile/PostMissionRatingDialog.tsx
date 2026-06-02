/**
 * Post-Mission Rating Dialog
 * Modale de notation déclenchée à la fin d'une prestation.
 * Critères : note globale + ponctualité, qualité, courtoisie + commentaire libre.
 */
import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCreateRating } from "@/hooks/queries/useMissionRatings";
import { useToast } from "@/hooks/use-toast";

interface PostMissionRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  clientId: string;
  providerId: string;
  providerName?: string;
  serviceName?: string;
  onRated?: () => void;
}

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "lg";
}

const RatingInput = ({ label, value, onChange, size = "sm" }: RatingInputProps) => {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const starClass = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                starClass,
                "transition-colors",
                n <= display ? "fill-primary text-primary" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const PostMissionRatingDialog = ({
  open,
  onOpenChange,
  bookingId,
  clientId,
  providerId,
  providerName,
  serviceName,
  onRated,
}: PostMissionRatingDialogProps) => {
  const [overall, setOverall] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [quality, setQuality] = useState(0);
  const [friendliness, setFriendliness] = useState(0);
  const [comment, setComment] = useState("");
  const [authorizedTestimonial, setAuthorizedTestimonial] = useState(false);

  const { mutateAsync, isPending } = useCreateRating();
  const { toast } = useToast();

  const reset = () => {
    setOverall(0);
    setPunctuality(0);
    setQuality(0);
    setFriendliness(0);
    setComment("");
    setAuthorizedTestimonial(false);
  };

  const handleSubmit = async () => {
    if (overall < 1) {
      toast({
        title: "Note manquante",
        description: "Merci d'attribuer une note globale.",
        variant: "destructive",
      });
      return;
    }
    try {
      await mutateAsync({
        booking_id: bookingId,
        client_id: clientId,
        provider_id: providerId,
        overall_rating: overall,
        punctuality: punctuality || null,
        quality: quality || null,
        friendliness: friendliness || null,
        comment: comment.trim() || null,
        authorized_testimonial: authorizedTestimonial,
      });
      toast({
        title: "Merci pour votre retour",
        description: "Votre évaluation a bien été enregistrée.",
      });
      reset();
      onOpenChange(false);
      onRated?.();
    } catch (error) {
      toast({
        title: "Impossible d'envoyer la note",
        description: error instanceof Error ? error.message : "Réessayez plus tard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Évaluez votre prestation</DialogTitle>
          <DialogDescription>
            {serviceName ? <>Service : <span className="font-medium">{serviceName}</span></> : null}
            {providerName ? (
              <> {serviceName ? "—" : ""} Prestataire : <span className="font-medium">{providerName}</span></>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/40 p-3">
            <RatingInput label="Note globale" value={overall} onChange={setOverall} size="lg" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <RatingInput label="Ponctualité" value={punctuality} onChange={setPunctuality} />
            <RatingInput label="Qualité" value={quality} onChange={setQuality} />
            <RatingInput label="Courtoisie" value={friendliness} onChange={setFriendliness} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-sm font-medium">
              Commentaire (optionnel)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience…"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="pr-3">
              <Label htmlFor="testimonial" className="text-sm font-medium">
                Autoriser la publication
              </Label>
              <p className="text-xs text-muted-foreground">
                Votre avis pourra être affiché publiquement (anonymisé).
              </p>
            </div>
            <Switch
              id="testimonial"
              checked={authorizedTestimonial}
              onCheckedChange={setAuthorizedTestimonial}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Plus tard
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Envoi…" : "Envoyer ma note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostMissionRatingDialog;
