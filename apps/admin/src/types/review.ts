import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

// Reviews
export type Review = T['reviews']['Row']
export type ReviewInsert = T['reviews']['Insert']
export type ReviewUpdate = T['reviews']['Update']

// NPS surveys
export type NpsSurvey = T['nps_surveys']['Row']
export type NpsSurveyInsert = T['nps_surveys']['Insert']
export type NpsSurveyUpdate = T['nps_surveys']['Update']

// Views
export type ReviewStatistics = V['review_statistics']['Row']
