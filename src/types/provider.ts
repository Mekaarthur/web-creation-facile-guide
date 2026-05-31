export interface ProviderAvailability {
  id: string;
  provider_id: string;
  day_of_week: number; // 0 = Dimanche, 1 = Lundi, etc.
  start_time: string; // Format HH:MM
  end_time: string; // Format HH:MM
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type: 'insurance' | 'certification' | 'identity' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean;
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  siret_number?: string | null;
  total_earnings?: number;
  monthly_earnings?: number;
  missions_accepted?: number;
  missions_completed?: number;
  acceptance_rate?: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  provider_availability?: ProviderAvailability[];
  provider_documents?: ProviderDocument[];
  provider_services?: {
    service_id: string;
    price_override: number | null;
  }[];
  distance?: number;
}

export interface ProviderNotification {
  id: string;
  provider_id: string;
  booking_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  reward_amount: number;
  created_at: string;
  completed_at?: string;
  expires_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── DB-derived types (source of truth from Supabase schema) ──────────────────
import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

export type ProviderRow = T['providers']['Row']
export type ProviderInsert = T['providers']['Insert']
export type ProviderUpdate = T['providers']['Update']

export type ProviderDocumentRow = T['provider_documents']['Row']
export type ProviderDocumentInsert = T['provider_documents']['Insert']
export type ProviderDocumentUpdate = T['provider_documents']['Update']

export type ProviderServiceRow = T['provider_services']['Row']
export type ProviderServiceInsert = T['provider_services']['Insert']
export type ProviderServiceUpdate = T['provider_services']['Update']

export type ProviderSubService = T['provider_sub_services']['Row']
export type ProviderSubServiceInsert = T['provider_sub_services']['Insert']
export type ProviderSubServiceUpdate = T['provider_sub_services']['Update']

export type ProviderAvailabilityRow = T['provider_availability']['Row']
export type ProviderAvailabilityInsert = T['provider_availability']['Insert']
export type ProviderAvailabilityUpdate = T['provider_availability']['Update']

export type ProviderLocation = T['provider_locations']['Row']
export type ProviderLocationInsert = T['provider_locations']['Insert']
export type ProviderLocationUpdate = T['provider_locations']['Update']

export type ProviderAbsence = T['provider_absences']['Row']
export type ProviderAbsenceInsert = T['provider_absences']['Insert']
export type ProviderAbsenceUpdate = T['provider_absences']['Update']

export type ProviderAttestation = T['provider_attestations']['Row']
export type ProviderAttestationInsert = T['provider_attestations']['Insert']
export type ProviderAttestationUpdate = T['provider_attestations']['Update']

export type ProviderIdentityVerification = T['provider_identity_verifications']['Row']
export type ProviderIdentityVerificationInsert = T['provider_identity_verifications']['Insert']
export type ProviderIdentityVerificationUpdate = T['provider_identity_verifications']['Update']

export type ProviderStatusHistory = T['provider_status_history']['Row']
export type ProviderStatusHistoryInsert = T['provider_status_history']['Insert']
export type ProviderStatusHistoryUpdate = T['provider_status_history']['Update']

export type ProviderAccessAudit = T['provider_access_audit']['Row']
export type ProviderAccessAuditInsert = T['provider_access_audit']['Insert']
export type ProviderAccessAuditUpdate = T['provider_access_audit']['Update']

export type PrestatairZone = T['prestataire_zones']['Row']
export type PrestatairZoneInsert = T['prestataire_zones']['Insert']
export type PrestatairZoneUpdate = T['prestataire_zones']['Update']

export type JobApplication = T['job_applications']['Row']
export type JobApplicationInsert = T['job_applications']['Insert']
export type JobApplicationUpdate = T['job_applications']['Update']

export type CandidaturePrestataire = T['candidatures_prestataires']['Row']
export type CandidaturePrestatireInsert = T['candidatures_prestataires']['Insert']
export type CandidaturePrestatireUpdate = T['candidatures_prestataires']['Update']

export type ApplicationDocumentValidation = T['application_document_validations']['Row']
export type ApplicationDocumentValidationInsert = T['application_document_validations']['Insert']
export type ApplicationDocumentValidationUpdate = T['application_document_validations']['Update']

// Views
export type ProviderPublicView = V['providers_public_view']['Row']
export type PrestatireZoneStat = V['prestataire_zones_stats']['Row']

// ── Legacy hand-written interfaces (kept for backwards compatibility) ─────────

export interface MatchingFilters {
  serviceId?: string;
  serviceType?: string;
  location?: string;
  urgency?: string;
  maxDistance?: number;
  minRating?: number;
  maxPrice?: number;
  dateTime?: Date;
}