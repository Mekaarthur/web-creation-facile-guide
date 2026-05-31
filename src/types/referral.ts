import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']

// Referrals
export type Referral = T['referrals']['Row']
export type ReferralInsert = T['referrals']['Insert']
export type ReferralUpdate = T['referrals']['Update']

// Client rewards
export type ClientReward = T['client_rewards']['Row']
export type ClientRewardInsert = T['client_rewards']['Insert']
export type ClientRewardUpdate = T['client_rewards']['Update']

// Monthly activity (loyalty tracking)
export type ClientMonthlyActivity = T['client_monthly_activity']['Row']
export type ClientMonthlyActivityInsert = T['client_monthly_activity']['Insert']
export type ClientMonthlyActivityUpdate = T['client_monthly_activity']['Update']
