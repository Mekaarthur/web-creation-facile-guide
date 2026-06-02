import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

// Geographic zones
export type ZoneGeographique = T['zones_geographiques']['Row']
export type ZoneGeographiqueInsert = T['zones_geographiques']['Insert']
export type ZoneGeographiqueUpdate = T['zones_geographiques']['Update']

// Zone-provider assignments
export type ZonePrestataire = T['zone_prestataires']['Row']
export type ZonePrestataireInsert = T['zone_prestataires']['Insert']
export type ZonePrestataireUpdate = T['zone_prestataires']['Update']

// Zone-client associations
export type ZoneClient = T['zone_clients']['Row']
export type ZoneClientInsert = T['zone_clients']['Insert']
export type ZoneClientUpdate = T['zone_clients']['Update']

// Zone alerts
export type ZoneAlert = T['zone_alerts']['Row']
export type ZoneAlertInsert = T['zone_alerts']['Insert']
export type ZoneAlertUpdate = T['zone_alerts']['Update']

// Views
export type ZoneStatistics = V['zone_statistics']['Row']
export type ZoneAlertWithDetails = V['zone_alerts_with_details']['Row']
export type PrestatireZoneStats = V['prestataire_zones_stats']['Row']
