/**
 * AutoRatingPrompt
 * Détecte la dernière mission terminée non notée du client connecté
 * et propose automatiquement la modale de notation.
 *
 * À monter une seule fois dans l'espace client.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PostMissionRatingDialog } from "./PostMissionRatingDialog";

interface PendingRating {
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceName: string;
}

const DISMISS_KEY = (uid: string) => `rating-dismissed-${uid}`;

const fetchNextUnratedMission = async (clientId: string): Promise<PendingRating | null> => {
  // Missions terminées du client
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, provider_id, service_id, completed_at")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .not("provider_id", "is", null)
    .order("completed_at", { ascending: false })
    .limit(20);

  if (error || !bookings?.length) return null;

  // Notes existantes pour ce client
  const { data: rated } = await supabase
    .from("mission_ratings")
    .select("booking_id")
    .eq("client_id", clientId);

  const ratedSet = new Set((rated ?? []).map((r) => r.booking_id));
  const next = bookings.find((b) => !ratedSet.has(b.id));
  if (!next || !next.provider_id) return null;

  // Détails prestataire & service (best-effort)
  const [{ data: providerData }, { data: serviceData }] = await Promise.all([
    supabase
      .from("providers")
      .select("business_name, user_id")
      .eq("id", next.provider_id)
      .maybeSingle(),
    supabase.from("services").select("name").eq("id", next.service_id).maybeSingle(),
  ]);

  let providerName = providerData?.business_name ?? "Votre prestataire";
  if (providerData?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", providerData.user_id)
      .maybeSingle();
    if (profile?.first_name) {
      providerName = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
    }
  }

  return {
    bookingId: next.id,
    providerId: next.provider_id,
    providerName,
    serviceName: serviceData?.name ?? "Prestation",
  };
};

export const AutoRatingPrompt = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY(user.id));
      setDismissed(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDismissed([]);
    }
  }, [user]);

  const { data: pending } = useQuery({
    queryKey: ["auto-rating-prompt", user?.id],
    queryFn: () => fetchNextUnratedMission(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (pending && !dismissed.includes(pending.bookingId)) {
      // Petit délai pour laisser la page se peindre
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [pending, dismissed]);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next && pending && user) {
      const updated = [...dismissed, pending.bookingId];
      setDismissed(updated);
      try {
        localStorage.setItem(DISMISS_KEY(user.id), JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }
  };

  if (!user || !pending) return null;

  return (
    <PostMissionRatingDialog
      open={open}
      onOpenChange={handleClose}
      bookingId={pending.bookingId}
      clientId={user.id}
      providerId={pending.providerId}
      providerName={pending.providerName}
      serviceName={pending.serviceName}
    />
  );
};

export default AutoRatingPrompt;
