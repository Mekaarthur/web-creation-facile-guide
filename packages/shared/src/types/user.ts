import type { Database } from '../integrations/supabase/types'

type T = Database['public']['Tables']

// Profile
export type Profile = T['profiles']['Row']
export type ProfileInsert = T['profiles']['Insert']
export type ProfileUpdate = T['profiles']['Update']

// User roles
export type UserRole = T['user_roles']['Row']
export type UserRoleInsert = T['user_roles']['Insert']
export type UserRoleUpdate = T['user_roles']['Update']

// Role enum
export type AppRole = Database['public']['Enums']['app_role']

// User presence
export type UserPresence = T['user_presence']['Row']
export type UserPresenceInsert = T['user_presence']['Insert']
export type UserPresenceUpdate = T['user_presence']['Update']

// Consents
export type UserConsent = T['user_consents']['Row']
export type UserConsentInsert = T['user_consents']['Insert']
export type UserConsentUpdate = T['user_consents']['Update']

// Account deletion
export type AccountDeletionRequest = T['account_deletion_requests']['Row']
export type AccountDeletionRequestInsert = T['account_deletion_requests']['Insert']
export type AccountDeletionRequestUpdate = T['account_deletion_requests']['Update']

// GDPR
export type GdprExport = T['gdpr_exports']['Row']
export type GdprExportInsert = T['gdpr_exports']['Insert']
export type GdprExportUpdate = T['gdpr_exports']['Update']

// Saved filters
export type SavedFilter = T['saved_filters']['Row']
export type SavedFilterInsert = T['saved_filters']['Insert']
export type SavedFilterUpdate = T['saved_filters']['Update']

// Views
type V = Database['public']['Views']
export type PendingDeletion = V['pending_deletions']['Row']
