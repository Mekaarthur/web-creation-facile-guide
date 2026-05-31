import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']

// Bookings
export type Booking = T['bookings']['Row']
export type BookingInsert = T['bookings']['Insert']
export type BookingUpdate = T['bookings']['Update']

// Booking slots
export type BookingSlot = T['booking_slots']['Row']
export type BookingSlotInsert = T['booking_slots']['Insert']
export type BookingSlotUpdate = T['booking_slots']['Update']

// Cart
export type Cart = T['carts']['Row']
export type CartInsert = T['carts']['Insert']
export type CartUpdate = T['carts']['Update']

export type CartItem = T['cart_items']['Row']
export type CartItemInsert = T['cart_items']['Insert']
export type CartItemUpdate = T['cart_items']['Update']

// Custom requests
export type CustomRequest = T['custom_requests']['Row']
export type CustomRequestInsert = T['custom_requests']['Insert']
export type CustomRequestUpdate = T['custom_requests']['Update']

export type ClientRequest = T['client_requests']['Row']
export type ClientRequestInsert = T['client_requests']['Insert']
export type ClientRequestUpdate = T['client_requests']['Update']

// Counter proposals
export type CounterProposal = T['counter_proposals']['Row']
export type CounterProposalInsert = T['counter_proposals']['Insert']
export type CounterProposalUpdate = T['counter_proposals']['Update']

// Custom booking preferences
export type CustomBookingPreference = T['custom_booking_preferences']['Row']
export type CustomBookingPreferenceInsert = T['custom_booking_preferences']['Insert']
export type CustomBookingPreferenceUpdate = T['custom_booking_preferences']['Update']

// Views
type V = Database['public']['Views']
export type ClientRequestProviderView = V['client_requests_provider_view']['Row']
