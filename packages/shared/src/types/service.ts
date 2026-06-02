import type { Database } from '../integrations/supabase/types'

type T = Database['public']['Tables']

// Services catalog
export type Service = T['services']['Row']
export type ServiceInsert = T['services']['Insert']
export type ServiceUpdate = T['services']['Update']
