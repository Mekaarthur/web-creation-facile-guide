import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']

// Platform settings
export type PlatformSetting = T['platform_settings']['Row']
export type PlatformSettingInsert = T['platform_settings']['Insert']
export type PlatformSettingUpdate = T['platform_settings']['Update']

// Platform stats access log
export type PlatformStatsAccess = T['platform_stats_access']['Row']
export type PlatformStatsAccessInsert = T['platform_stats_access']['Insert']
export type PlatformStatsAccessUpdate = T['platform_stats_access']['Update']

// Subscribers (Stripe-backed)
export type Subscriber = T['subscribers']['Row']
export type SubscriberInsert = T['subscribers']['Insert']
export type SubscriberUpdate = T['subscribers']['Update']

// FAQ / knowledge base
export type FaqKnowledgeBase = T['faq_knowledge_base']['Row']
export type FaqKnowledgeBaseInsert = T['faq_knowledge_base']['Insert']
export type FaqKnowledgeBaseUpdate = T['faq_knowledge_base']['Update']

// Acquisition tracking
export type AcquisitionTracking = T['acquisition_tracking']['Row']
export type AcquisitionTrackingInsert = T['acquisition_tracking']['Insert']
export type AcquisitionTrackingUpdate = T['acquisition_tracking']['Update']
