import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRewardsRequest {
  type: 'client' | 'provider' | 'annual_reset';
  userId?: string;
  providerId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { type, userId, providerId }: ProcessRewardsRequest = await req.json();

    console.log('Processing rewards:', { type, userId, providerId });

    switch (type) {
      case 'client':
        await processClientRewards(supabase, userId);
        break;
      case 'provider':
        await processProviderRewards(supabase, providerId);
        break;
      case 'annual_reset':
        await processAnnualReset(supabase);
        break;
      default:
        throw new Error('Invalid reward processing type');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Rewards processed successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error processing rewards:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function processClientRewards(supabase: any, userId?: string) {
  console.log('Processing client rewards for user:', userId);

  // Update monthly activity for completed bookings
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      client_id,
      booking_date,
      start_time,
      end_time,
      status
    `)
    .eq('status', 'completed')
    .gte('booking_date', new Date(new Date().getFullYear(), 0, 1).toISOString())
    .eq(userId ? 'client_id' : 'id', userId || 'dummy');

  if (!completedBookings) return;

  // Group bookings by client and month
  const clientMonthlyHours = new Map();

  for (const booking of completedBookings) {
    const date = new Date(booking.booking_date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${booking.client_id}-${year}-${month}`;

    // Calculate hours worked
    const startTime = new Date(`2000-01-01T${booking.start_time}`);
    const endTime = new Date(`2000-01-01T${booking.end_time}`);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (!clientMonthlyHours.has(key)) {
      clientMonthlyHours.set(key, {
        client_id: booking.client_id,
        year,
        month,
        total_hours: 0
      });
    }

    const current = clientMonthlyHours.get(key);
    current.total_hours += hours;
  }

  // Update or insert monthly activity records
  for (const [, activity] of clientMonthlyHours) {
    const { error } = await supabase
      .from('client_monthly_activity')
      .upsert({
        client_id: activity.client_id,
        year: activity.year,
        month: activity.month,
        total_hours: activity.total_hours,
        consecutive_months: await calculateConsecutiveMonths(supabase, activity.client_id, activity.year, activity.month)
      }, {
        onConflict: 'client_id,year,month'
      });

    if (error) {
      console.error('Error updating monthly activity:', error);
    }
  }

  // Check and award client rewards
  for (const [, activity] of clientMonthlyHours) {
    const isEligible = await supabase.rpc('check_client_reward_eligibility', {
      p_client_id: activity.client_id
    });

    if (isEligible.data) {
      // Check if reward already exists this year
      const { data: existingReward } = await supabase
        .from('client_rewards')
        .select('id')
        .eq('client_id', activity.client_id)
        .gte('earned_date', `${activity.year}-01-01`)
        .lt('earned_date', `${activity.year + 1}-01-01`)
        .single();

      if (!existingReward) {
        await supabase.from('client_rewards').insert({
          client_id: activity.client_id,
          reward_type: 'psychologist_voucher'
        });
        console.log('Awarded client reward to:', activity.client_id);
      }
    }
  }
}

async function processProviderRewards(supabase: any, providerId?: string) {
  console.log('Processing provider rewards for provider:', providerId);

  const currentYear = new Date().getFullYear();

  // Get all providers or specific provider
  const { data: providers } = await supabase
    .from('providers')
    .select('*')
    .eq(providerId ? 'id' : 'created_at', providerId || new Date().toISOString())
    .is(providerId ? null : 'id', null);

  if (!providers) return;

  for (const provider of providers) {
    // Calculate months active
    const createdAt = new Date(provider.created_at);
    const now = new Date();
    const monthsActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (monthsActive < 6) continue; // Must be active for 6+ months

    // Calculate total hours worked this year
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('provider_id', provider.id)
      .eq('status', 'completed')
      .gte('booking_date', `${currentYear}-01-01`)
      .lt('booking_date', `${currentYear + 1}-01-01`);

    const totalHours = bookings?.reduce((sum: number, booking: any) => {
      const start = new Date(`2000-01-01T${booking.start_time}`);
      const end = new Date(`2000-01-01T${booking.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0) || 0;

    // Calculate reward tier
    const { data: tier } = await supabase.rpc('calculate_provider_reward_tier', {
      p_provider_id: provider.id,
      p_missions_count: provider.missions_completed || 0,
      p_hours_worked: totalHours,
      p_average_rating: provider.rating || 0,
      p_months_active: monthsActive
    });

    if (tier) {
      // Check if reward already exists this year
      const { data: existingReward } = await supabase
        .from('provider_rewards')
        .select('id')
        .eq('provider_id', provider.id)
        .eq('year', currentYear)
        .single();

      if (!existingReward) {
        const { data: amount } = await supabase.rpc('get_reward_amount', { p_tier: tier });

        await supabase.from('provider_rewards').insert({
          provider_id: provider.id,
          reward_tier: tier,
          amount: amount,
          year: currentYear,
          missions_count: provider.missions_completed || 0,
          hours_worked: totalHours,
          average_rating: provider.rating || 0
        });

        console.log('Awarded provider reward:', { provider: provider.id, tier, amount });
      }
    }
  }
}

async function processAnnualReset(supabase: any) {
  console.log('Processing annual reset');

  // Expire all active client rewards
  const { error: expireError } = await supabase
    .from('client_rewards')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());

  if (expireError) {
    console.error('Error expiring client rewards:', expireError);
  }

  // Reset provider stats for new year could be added here if needed
  console.log('Annual reset completed');
}

async function calculateConsecutiveMonths(supabase: any, clientId: string, currentYear: number, currentMonth: number): Promise<number> {
  let consecutive = 0;
  let year = currentYear;
  let month = currentMonth;

  while (true) {
    const { data: activity } = await supabase
      .from('client_monthly_activity')
      .select('total_hours')
      .eq('client_id', clientId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (!activity || activity.total_hours < 10) break;

    consecutive++;
    
    // Go to previous month
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }

    // Don't go back more than 12 months
    if (consecutive >= 12) break;
  }

  return consecutive;
}

serve(handler);