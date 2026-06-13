import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { corsHeaders } from "../_shared/cors.ts";

/**
 * Actions disponibles :
 * - request   : client marque un prestataire comme favori après une mission
 * - respond   : prestataire accepte ou refuse la demande
 * - withdraw  : client retire son favori
 * - list_pending : prestataire liste ses demandes en attente
 * - list_favorites : client liste ses favoris actifs
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, providerId, bookingId, response } = await req.json();

    // ── ACTION: request ──────────────────────────────────────────────
    if (action === "request") {
      if (!providerId) {
        return new Response(JSON.stringify({ error: "providerId requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Vérifier que la mission est bien 'completed' et appartient à ce client
      if (bookingId) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, client_id, provider_id, status")
          .eq("id", bookingId)
          .eq("client_id", user.id)
          .single();

        if (!booking || booking.status !== "completed") {
          return new Response(
            JSON.stringify({ error: "La mission doit être terminée pour ajouter un favori" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { data: favorite, error } = await supabase
        .from("client_favorites")
        .upsert(
          {
            client_id: user.id,
            provider_id: providerId,
            booking_id: bookingId ?? null,
            client_status: "accepted",
            provider_status: "pending",
            status: "pending_provider",
          },
          { onConflict: "client_id,provider_id" }
        )
        .select()
        .single();

      if (error) throw error;

      // Notifier le prestataire
      await supabase.from("provider_notifications").insert({
        provider_id: providerId,
        title: "Un client vous a ajouté en favori",
        message: "Un client souhaite vous avoir comme prestataire privilégié. Acceptez pour former un binôme.",
        type: "favorite_request",
        data: { favorite_id: favorite.id, client_id: user.id },
      });

      return new Response(JSON.stringify({ success: true, favorite }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: respond ──────────────────────────────────────────────
    if (action === "respond") {
      if (!providerId || !response) {
        return new Response(JSON.stringify({ error: "providerId et response requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Vérifier que ce prestataire appartient bien à cet utilisateur
      const { data: providerRow } = await supabase
        .from("providers")
        .select("id")
        .eq("id", providerId)
        .eq("user_id", user.id)
        .single();

      if (!providerRow) {
        return new Response(JSON.stringify({ error: "Prestataire non trouvé" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["accepted", "declined"].includes(response)) {
        return new Response(JSON.stringify({ error: "response doit être 'accepted' ou 'declined'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newStatus = response === "accepted" ? "active" : "declined";

      const { data: favorite, error } = await supabase
        .from("client_favorites")
        .update({
          provider_status: response,
          status: newStatus,
        })
        .eq("provider_id", providerId)
        .eq("provider_status", "pending")
        .select()
        .single();

      if (error) throw error;
      if (!favorite) {
        return new Response(JSON.stringify({ error: "Demande introuvable ou déjà traitée" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notifier le client du résultat
      const { data: providerProfile } = await supabase
        .from("providers")
        .select("business_name, user_id")
        .eq("id", providerId)
        .single();

      const providerName = providerProfile?.business_name || "Le prestataire";

      await supabase.from("realtime_notifications").insert({
        user_id: favorite.client_id,
        type: response === "accepted" ? "favorite_accepted" : "favorite_declined",
        title: response === "accepted"
          ? `${providerName} a accepté votre demande de binôme !`
          : `${providerName} a décliné votre demande de binôme`,
        message: response === "accepted"
          ? "Vous êtes maintenant liés ! Ce prestataire sera prioritaire pour vos futures missions."
          : "Vous pouvez choisir un autre prestataire favori depuis votre espace.",
        priority: "normal",
        data: { provider_id: providerId, favorite_id: favorite.id },
      });

      return new Response(JSON.stringify({ success: true, favorite }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: withdraw ─────────────────────────────────────────────
    if (action === "withdraw") {
      if (!providerId) {
        return new Response(JSON.stringify({ error: "providerId requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("client_favorites")
        .update({ client_status: "withdrawn", status: "withdrawn" })
        .eq("client_id", user.id)
        .eq("provider_id", providerId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: list_pending (prestataire) ───────────────────────────
    if (action === "list_pending") {
      const { data: providerRow } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!providerRow) {
        return new Response(JSON.stringify({ error: "Profil prestataire introuvable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: pending, error } = await supabase
        .from("client_favorites")
        .select(`
          id, client_id, booking_id, created_at,
          client:profiles!client_favorites_client_id_fkey(first_name, last_name, email)
        `)
        .eq("provider_id", providerRow.id)
        .eq("provider_status", "pending");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, pending }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: list_favorites (client) ──────────────────────────────
    if (action === "list_favorites") {
      const { data: favorites, error } = await supabase
        .from("client_favorites")
        .select(`
          id, provider_id, status, created_at,
          provider:providers(id, business_name, rating, is_verified)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, favorites }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[manage-favorites] Erreur:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
