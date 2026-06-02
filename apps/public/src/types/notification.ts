import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']

// Client notifications
export type Notification = T['notifications']['Row']
export type NotificationInsert = T['notifications']['Insert']
export type NotificationUpdate = T['notifications']['Update']

// Provider notifications
export type ProviderNotification = T['provider_notifications']['Row']
export type ProviderNotificationInsert = T['provider_notifications']['Insert']
export type ProviderNotificationUpdate = T['provider_notifications']['Update']

// Realtime notifications
export type RealtimeNotification = T['realtime_notifications']['Row']
export type RealtimeNotificationInsert = T['realtime_notifications']['Insert']
export type RealtimeNotificationUpdate = T['realtime_notifications']['Update']

// Notification logs
export type NotificationLog = T['notification_logs']['Row']
export type NotificationLogInsert = T['notification_logs']['Insert']
export type NotificationLogUpdate = T['notification_logs']['Update']
