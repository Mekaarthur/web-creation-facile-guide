/**
 * Hook React Query — Notifications V2 (hub unifié)
 *
 * ⚠️ L'ancien hook `src/hooks/useNotifications.tsx` reste en place et utilisé
 * par les composants existants. Cette V2 est destinée aux nouveaux composants
 * et à la migration progressive.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationServiceV2, type NotificationFilters, type NotificationPayload, type Notification } from "@/services/notificationServiceV2";

export const notificationKeys = {
  all: ["notifications-v2"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, "unread", userId] as const,
};

export const useNotificationsV2 = (filters: NotificationFilters = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationServiceV2.list(filters),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useUnreadCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ""),
    queryFn: () => notificationServiceV2.unreadCount(userId!),
    enabled: !!userId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => notificationServiceV2.markAsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => notificationServiceV2.markAllAsRead(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useSendNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPayload) => notificationServiceV2.send(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export type { Notification, NotificationFilters, NotificationPayload };
