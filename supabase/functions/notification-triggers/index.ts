/**
 * GUIDE D'UTILISATION - Notifications Admin Automatiques
 * 
 * Ce fichier sert de documentation pour intégrer les notifications automatiques
 * dans vos différents événements système.
 * 
 * Pour créer une notification admin, appelez la fonction 'create-admin-notification'
 * depuis n'importe quelle edge function ou trigger.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Exemple d'utilisation dans vos edge functions existantes:

/**
 * EXEMPLE 1: Nouvelle inscription utilisateur
 * À placer dans votre fonction d'inscription
 */
async function notifyNewUserRegistration(userId: string, userName: string, userEmail: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'new_user',
      title: '🧍 Nouvel utilisateur inscrit',
      message: `${userName} (${userEmail}) vient de créer un compte`,
      data: {
        user_id: userId,
        user_name: userName,
        user_email: userEmail
      },
      priority: 'normal'
    }
  });
}

/**
 * EXEMPLE 2: Nouvelle candidature prestataire
 * À placer dans votre système de candidatures
 */
async function notifyNewProviderApplication(providerId: string, providerName: string, serviceType: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'provider_application',
      title: '📋 Nouvelle candidature prestataire',
      message: `${providerName} a postulé pour devenir prestataire (${serviceType})`,
      data: {
        provider_id: providerId,
        provider_name: providerName,
        service_type: serviceType
      },
      priority: 'high'
    }
  });
}

/**
 * EXEMPLE 3: Nouvelle réservation
 * À placer dans votre fonction de création de réservation
 */
async function notifyNewBooking(bookingId: string, clientName: string, serviceType: string, amount: number) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'booking',
      title: '📅 Nouvelle réservation',
      message: `${clientName} a réservé ${serviceType} pour ${amount}€`,
      data: {
        booking_id: bookingId,
        client_name: clientName,
        service_type: serviceType,
        amount: amount
      },
      priority: 'normal'
    }
  });
}

/**
 * EXEMPLE 4: Paiement échoué
 * À placer dans votre webhook Stripe
 */
async function notifyPaymentFailed(paymentId: string, clientName: string, amount: number, reason: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'payment_failed',
      title: '⚠️ Paiement échoué',
      message: `Le paiement de ${clientName} (${amount}€) a échoué: ${reason}`,
      data: {
        payment_id: paymentId,
        client_name: clientName,
        amount: amount,
        failure_reason: reason
      },
      priority: 'urgent'
    }
  });
}

/**
 * EXEMPLE 5: Paiement réussi
 * À placer dans votre webhook Stripe (checkout.session.completed)
 */
async function notifyPaymentSuccess(paymentId: string, clientName: string, amount: number, bookingId: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'payment_success',
      title: '💰 Paiement reçu',
      message: `Paiement de ${amount}€ reçu de ${clientName}`,
      data: {
        payment_id: paymentId,
        booking_id: bookingId,
        client_name: clientName,
        amount: amount
      },
      priority: 'normal'
    }
  });
}

/**
 * EXEMPLE 6: Réservation annulée
 * À placer dans votre fonction d'annulation
 */
async function notifyBookingCancelled(bookingId: string, cancelledBy: string, reason: string) {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'booking_cancelled',
      title: '❌ Réservation annulée',
      message: `Réservation #${bookingId} annulée par ${cancelledBy}: ${reason}`,
      data: {
        booking_id: bookingId,
        cancelled_by: cancelledBy,
        cancellation_reason: reason
      },
      priority: 'high'
    }
  });
}

/**
 * EXEMPLE 7: Alerte système
 * À placer dans vos systèmes de monitoring
 */
async function notifySystemAlert(alertType: string, message: string, severity: 'low' | 'normal' | 'high' | 'urgent') {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await supabaseAdmin.functions.invoke('create-admin-notification', {
    body: {
      type: 'system',
      title: `⚙️ Alerte système: ${alertType}`,
      message: message,
      data: {
        alert_type: alertType,
        timestamp: new Date().toISOString()
      },
      priority: severity
    }
  });
}

/**
 * LISTE DES TYPES DE NOTIFICATIONS DISPONIBLES:
 * 
 * - new_user: Nouvelle inscription utilisateur
 * - new_client: Nouveau client
 * - new_provider: Nouveau prestataire
 * - provider_application: Candidature prestataire en attente
 * - booking: Nouvelle réservation
 * - booking_confirmed: Réservation confirmée
 * - booking_cancelled: Réservation annulée
 * - payment: Paiement générique
 * - payment_success: Paiement réussi
 * - payment_failed: Paiement échoué
 * - new_message: Nouveau message
 * - conversation_alert: Alerte conversation (mots-clés détectés)
 * - system: Alerte système
 * - emergency_escalated: Urgence escaladée
 * - moderation: Signalement/modération
 * 
 * PRIORITÉS DISPONIBLES:
 * - low: Priorité faible
 * - normal: Priorité normale (défaut)
 * - high: Priorité haute
 * - urgent: Priorité urgente (alerte immédiate)
 */

// Note: Ce fichier est documentaire, pas une edge function active
