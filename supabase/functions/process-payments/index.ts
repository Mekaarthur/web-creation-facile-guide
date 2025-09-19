import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { action, transactionId, bookingId } = await req.json()

    switch (action) {
      case 'process_provider_payment':
        return await processProviderPayment(supabase, transactionId)
      
      case 'process_booking_payments':
        return await processBookingPayments(supabase, bookingId)
      
      case 'calculate_commission':
        const { serviceCategory, clientPrice } = await req.json()
        return await calculateCommission(supabase, serviceCategory, clientPrice)
      
      case 'bulk_provider_payments':
        return await processBulkProviderPayments(supabase)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Error in process-payments function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processProviderPayment(supabase: any, transactionId: string) {
  try {
    // Get transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError) throw fetchError

    // Update payment status
    const { error: updateError } = await supabase
      .from('financial_transactions')
      .update({
        payment_status: 'provider_paid',
        provider_paid_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    if (updateError) throw updateError

    // Log the payment action
    await supabase
      .from('admin_actions_log')
      .insert({
        admin_user_id: 'system', // Will be replaced with actual admin user
        entity_type: 'financial_transaction',
        entity_id: transactionId,
        action_type: 'provider_payment_processed',
        new_data: { 
          provider_payment: transaction.provider_payment,
          processed_at: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Provider payment processed successfully',
        amount: transaction.provider_payment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing provider payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function processBookingPayments(supabase: any, bookingId: string) {
  try {
    // Get booking details with service category
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (category, name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError

    // Determine service category for financial rules
    const serviceCategory = determineServiceCategory(booking.services?.category || '')

    // Calculate financial breakdown
    const { data: breakdown } = await supabase
      .rpc('calculate_financial_breakdown', {
        p_service_category: serviceCategory,
        p_client_price: booking.total_price
      })

    if (!breakdown || breakdown.length === 0) {
      throw new Error('Could not calculate financial breakdown')
    }

    // Create or update financial transaction
    const { error: transactionError } = await supabase
      .from('financial_transactions')
      .upsert({
        booking_id: bookingId,
        client_id: booking.client_id,
        provider_id: booking.provider_id,
        service_category: serviceCategory,
        client_price: booking.total_price,
        provider_payment: breakdown[0].provider_payment,
        company_commission: breakdown[0].company_commission,
        payment_status: 'client_paid',
        client_paid_at: new Date().toISOString()
      }, {
        onConflict: 'booking_id'
      })

    if (transactionError) throw transactionError

    return new Response(
      JSON.stringify({ 
        success: true,
        breakdown: breakdown[0],
        serviceCategory
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing booking payments:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function calculateCommission(supabase: any, serviceCategory: string, clientPrice: number) {
  try {
    const { data: breakdown } = await supabase
      .rpc('calculate_financial_breakdown', {
        p_service_category: serviceCategory,
        p_client_price: clientPrice
      })

    if (!breakdown || breakdown.length === 0) {
      throw new Error('Could not calculate commission')
    }

    return new Response(
      JSON.stringify(breakdown[0]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error calculating commission:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function processBulkProviderPayments(supabase: any) {
  try {
    // Get all transactions where client has paid but provider hasn't been paid yet
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('payment_status', 'client_paid')

    if (fetchError) throw fetchError

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending provider payments found',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process all pending payments
    const { error: updateError } = await supabase
      .from('financial_transactions')
      .update({
        payment_status: 'provider_paid',
        provider_paid_at: new Date().toISOString()
      })
      .eq('payment_status', 'client_paid')

    if (updateError) throw updateError

    const totalAmount = pendingTransactions.reduce((sum, t) => sum + t.provider_payment, 0)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${pendingTransactions.length} provider payments`,
        processed: pendingTransactions.length,
        totalAmount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing bulk provider payments:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

function determineServiceCategory(category: string): string {
  const lowerCategory = category.toLowerCase()
  
  if (lowerCategory.includes('kids') || lowerCategory.includes('enfant')) return 'bika_kids'
  if (lowerCategory.includes('maison') || lowerCategory.includes('home')) return 'bika_maison'
  if (lowerCategory.includes('vie') || lowerCategory.includes('life')) return 'bika_vie'
  if (lowerCategory.includes('travel') || lowerCategory.includes('voyage')) return 'bika_travel'
  if (lowerCategory.includes('senior') || lowerCategory.includes('âgé')) return 'bika_seniors'
  if (lowerCategory.includes('animal') || lowerCategory.includes('pet')) return 'bika_animals'
  if (lowerCategory.includes('pro') || lowerCategory.includes('business')) return 'bika_pro'
  if (lowerCategory.includes('plus') || lowerCategory.includes('premium')) return 'bika_plus'
  if (lowerCategory.includes('entretien') || lowerCategory.includes('jardinage')) return 'entretien_espaces_verts'
  if (lowerCategory.includes('maintenance') || lowerCategory.includes('réparation')) return 'maintenance'
  
  return 'bika_maison' // Default
}