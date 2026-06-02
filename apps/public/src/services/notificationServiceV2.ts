/**
 * Service Layer — Notifications (Hub unifié V2)
 *
 * Hub centralisé pour toutes les notifications de la plateforme.
 * - Persistance en base (table `notifications`)
 * - Envoi multi-canal (push / email / sms) via les edge functions existantes
 *   (`send-modern-notification`, `send-notification-email`, `send-critical-sms`)
 *
 * ⚠️ L'ancien hook `src/hooks/useNotifications.tsx` reste opérationnel.
 * Cette V2 est utilisée via `src/hooks/queries/useNotificationsV2.ts`.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationTarget = "client" | "provider" | "admin";
export type NotificationChannel = "push" | "email" | "sms" | "inapp";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface NotificationPayload {
  target: NotificationTarget;
  userId: string;
  type: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  priority?: NotificationPriority;
  bookingId?: string;
}

export interface NotificationFilters {
  userId?: string;
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
}

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "NotificationServiceError";
  }
}

export const notificationServiceV2 = {
  /** Liste les notifications (filtres user/unread/type). */
  async list(filters: NotificationFilters = {}): Promise<Notification[]> {
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.unreadOnly) query = query.eq("is_read", false);
    if (filters.type) query = query.eq("type", filters.type);
    query = query.limit(filters.limit ?? 50);

    const { data, error } = await query;
    if (error) throw new ServiceError("Erreur lors du chargement des notifications", error.code, error);
    return data ?? [];
  },

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw new ServiceError("Comptage impossible", error.code, error);
    return count ?? 0;
  },

  async markAsRead(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new ServiceError("Marquage impossible", error.code, error);
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw new ServiceError("Marquage global impossible", error.code, error);
  },

  /**
   * Envoi unifié : enregistre en base + dispatch sur les canaux demandés.
   * - inapp : insertion table notifications (toujours fait si channels.includes('inapp'))
   * - push  : edge function send-modern-notification
   * - email : edge function send-modern-notification (fallback send-notification-email)
   * - sms   : edge function send-critical-sms (priorité critical uniquement)
   */
  async send(payload: NotificationPayload): Promise<{ persisted: boolean; channels: NotificationChannel[] }> {
    const channels = payload.channels ?? ["inapp"];
    const persisted = channels.includes("inapp");

    // 1. Persistance in-app
    if (persisted) {
      const { error } = await supabase.from("notifications").insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        booking_id: payload.bookingId ?? null,
      });
      if (error) throw new ServiceError("Insertion notification impossible", error.code, error);
    }

    // 2. Push & email via edge function moderne
    if (channels.includes("push") || channels.includes("email")) {
      try {
        await supabase.functions.invoke("send-modern-notification", {
          body: {
            type: payload.type,
            recipient: { id: payload.userId, target: payload.target },
            data: { title: payload.title, message: payload.message, ...(payload.data ?? {}) },
            channels: channels.filter(c => c === "push" || c === "email"),
            priority: payload.priority ?? "medium",
          },
        });
      } catch (err) {
        console.warn("[notificationServiceV2] push/email échoué, fallback email", err);
        if (channels.includes("email")) {
          // best-effort fallback
          await supabase.functions.invoke("send-notification-email", {
            body: { type: payload.type, data: payload.data ?? {} },
          }).catch(() => {});
        }
      }
    }

    // 3. SMS critique
    if (channels.includes("sms") && payload.priority === "critical") {
      await supabase.functions.invoke("send-critical-sms", {
        body: { userId: payload.userId, message: payload.message, data: payload.data ?? {} },
      }).catch(err => console.warn("[notificationServiceV2] sms échoué", err));
    }

    return { persisted, channels };
  },
};

export { ServiceError as NotificationServiceError };
