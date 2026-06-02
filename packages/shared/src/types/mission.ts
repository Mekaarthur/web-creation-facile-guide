import type { Database } from '../integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

// Missions
export type Mission = T['missions']['Row']
export type MissionInsert = T['missions']['Insert']
export type MissionUpdate = T['missions']['Update']

// Prestations réalisées
export type PrestationRealisee = T['prestations_realisees']['Row']
export type PrestationRealiseeInsert = T['prestations_realisees']['Insert']
export type PrestationRealiseeUpdate = T['prestations_realisees']['Update']

// Mission ratings
export type MissionRating = T['mission_ratings']['Row']
export type MissionRatingInsert = T['mission_ratings']['Insert']
export type MissionRatingUpdate = T['mission_ratings']['Update']

// Binômes
export type Binome = T['binomes']['Row']
export type BinomeInsert = T['binomes']['Insert']
export type BinomeUpdate = T['binomes']['Update']

export type BinomeHistory = T['binomes_history']['Row']
export type BinomeHistoryInsert = T['binomes_history']['Insert']
export type BinomeHistoryUpdate = T['binomes_history']['Update']

// Emergency assignments
export type EmergencyAssignment = T['emergency_assignments']['Row']
export type EmergencyAssignmentInsert = T['emergency_assignments']['Insert']
export type EmergencyAssignmentUpdate = T['emergency_assignments']['Update']

// Attestations
export type Attestation = T['attestations']['Row']
export type AttestationInsert = T['attestations']['Insert']
export type AttestationUpdate = T['attestations']['Update']

// Provider rewards
export type ProviderReward = T['provider_rewards']['Row']
export type ProviderRewardInsert = T['provider_rewards']['Insert']
export type ProviderRewardUpdate = T['provider_rewards']['Update']

export type ProviderReferralReward = T['provider_referral_rewards']['Row']
export type ProviderReferralRewardInsert = T['provider_referral_rewards']['Insert']
export type ProviderReferralRewardUpdate = T['provider_referral_rewards']['Update']

// Views
export type MissionsWithoutProvidersInZone = V['missions_without_providers_in_zone']['Row']
