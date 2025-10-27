import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le rôle admin
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé - Droits administrateur requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json()
    
    console.log(`Analytics action: ${action} Data:`, params)

    let result;

    switch (action) {
      case 'get_analytics':
        result = await getAnalytics(supabase, params);
        break;
      case 'get_reports':
        result = await getReports(supabase, params);
        break;
      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur interne du serveur' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function getAnalytics(supabase: any, { timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Services mapping
  const serviceNames = {
    'Aide aux enfants': 'BikaKids',
    'Garde d\'enfants': 'BikaKids', 
    'Ménage': 'BikaMaison',
    'Bricolage': 'BikaMaison',
    'Jardinage': 'BikaMaison',
    'Aide aux seniors': 'BikaSeniors',
    'Accompagnement seniors': 'BikaSeniors',
    'Garde d\'animaux': 'BikaAnimals',
    'Promenade chiens': 'BikaAnimals',
    'Voyage': 'BikaTravel',
    'Transport': 'BikaTravel',
    'Services administratifs': 'BikaPro',
    'Assistance business': 'BikaPro',
    'Conciergerie premium': 'BikaPlus',
    'Services exclusifs': 'BikaPlus',
    'Organisation événements': 'BikaVie',
    'Planning personnel': 'BikaVie'
  };

  // Get bookings data
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      services!inner(name)
    `)
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    throw new Error('Erreur lors de la récupération des réservations');
  }

  // Calculate KPIs
  const totalRevenue = bookings?.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0) || 0;
  const totalBookings = bookings?.length || 0;
  const averageBasket = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  // Average duration
  const totalDuration = bookings?.reduce((sum: number, booking: any) => {
    if (booking.start_time && booking.end_time) {
      const start = new Date(`1970-01-01T${booking.start_time}`);
      const end = new Date(`1970-01-01T${booking.end_time}`);
      return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }
    return sum;
  }, 0) || 0;
  const averageDuration = totalBookings > 0 ? totalDuration / totalBookings : 0;

  // Monthly data for charts
  const monthlyData: any = {};
  const currentDate = new Date();
  
  for (let i = 4; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthBookings = bookings?.filter((booking: any) => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    }) || [];
    
    const monthRevenue = monthBookings.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0);
    
    monthlyData[monthKey] = {
      month: monthKey,
      revenue: monthRevenue,
      bookings: monthBookings.length
    };
  }

  // Services distribution
  const servicesData: any = {};
  
  // Initialize all Bika services
  ['BikaKids', 'BikaMaison', 'BikaSeniors', 'BikaAnimals', 'BikaTravel', 'BikaPro', 'BikaPlus', 'BikaVie'].forEach(service => {
    servicesData[service] = { count: 0, revenue: 0 };
  });
  
  bookings?.forEach((booking: any) => {
    const serviceName = booking.services?.name || 'Autre';
    const bikaService = serviceNames[serviceName] || 'BikaMaison'; // Default fallback
    
    if (!servicesData[bikaService]) {
      servicesData[bikaService] = { count: 0, revenue: 0 };
    }
    
    servicesData[bikaService].count++;
    servicesData[bikaService].revenue += booking.total_price || 0;
  });

  const servicesArray = Object.entries(servicesData).map(([name, data]: [string, any], index) => ({
    name,
    value: totalBookings > 0 ? Math.round((data.count / totalBookings) * 100) : 0,
    revenue: data.revenue,
    color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'][index % 8]
  }));

  return {
    kpis: {
      totalRevenue,
      totalBookings,
      averageBasket,
      averageDuration: Math.round(averageDuration * 10) / 10,
      conversionRate: 24.8, // Mock for now, would need to calculate from actual funnel data
    },
    monthlyRevenue: Object.values(monthlyData),
    monthlyBookings: Object.values(monthlyData),
    servicesDistribution: servicesArray.filter(s => s.value > 0)
  };
}

async function getReports(supabase: any, { timeRange = '30d' }: any) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get comprehensive data for reports
  const [bookingsResult, providersResult, paymentsResult] = await Promise.all([
    // Bookings data
    supabase
      .from('bookings')
      .select(`
        *,
        services!inner(name, category)
      `)
      .gte('created_at', startDate.toISOString()),
    
    // Providers data
    supabase
      .from('providers')
      .select('*'),
    
    // Payments data
    supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'confirme')
  ]);

  if (bookingsResult.error) throw bookingsResult.error;
  if (providersResult.error) throw providersResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const bookings = bookingsResult.data || [];
  const providers = providersResult.data || [];
  const payments = paymentsResult.data || [];

  // Calculate financial metrics
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');
  const totalRevenue = payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
  const totalBookingsCount = bookings.length;
  const averageBasket = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : 0;

  // Monthly revenue evolution
  const monthlyData = [];
  const currentDate = new Date();
  
  for (let i = 4; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthBookings = bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });
    
    const monthPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    });
    
    const monthRevenue = monthPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    
    monthlyData.push({
      month: monthKey,
      value: monthRevenue,
      bookings: monthBookings.length
    });
  }

  // Services analysis with all Bika services
  const serviceNames = {
    'Aide aux enfants': 'BikaKids',
    'Garde d\'enfants': 'BikaKids', 
    'Ménage': 'BikaMaison',
    'Bricolage': 'BikaMaison',
    'Jardinage': 'BikaMaison',
    'Aide aux seniors': 'BikaSeniors',
    'Accompagnement seniors': 'BikaSeniors',
    'Garde d\'animaux': 'BikaAnimals',
    'Promenade chiens': 'BikaAnimals',
    'Voyage': 'BikaTravel',
    'Transport': 'BikaTravel',
    'Services administratifs': 'BikaPro',
    'Assistance business': 'BikaPro',
    'Conciergerie premium': 'BikaPlus',
    'Services exclusifs': 'BikaPlus',
    'Organisation événements': 'BikaVie',
    'Planning personnel': 'BikaVie'
  };

  const servicesData: any = {};
  
  // Initialize all Bika services
  ['BikaKids', 'BikaMaison', 'BikaSeniors', 'BikaAnimals', 'BikaTravel', 'BikaPro', 'BikaPlus', 'BikaVie'].forEach(service => {
    servicesData[service] = { count: 0, revenue: 0, value: 0 };
  });
  
  completedBookings.forEach((booking: any) => {
    const serviceName = booking.services?.name || 'Autre';
    const bikaService = serviceNames[serviceName] || 'BikaMaison';
    
    servicesData[bikaService].count++;
    servicesData[bikaService].revenue += booking.total_price || 0;
  });

  // Calculate percentages
  Object.keys(servicesData).forEach(service => {
    servicesData[service].value = totalBookingsCount > 0 
      ? Math.round((servicesData[service].count / totalBookingsCount) * 100) 
      : 0;
  });

  const servicesArray = Object.entries(servicesData).map(([name, data]: [string, any], index) => ({
    name,
    ...data,
    color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'][index % 8]
  })).filter(s => s.count > 0);

  // Provider analysis
  const activeProviders = providers.filter((p: any) => p.status === 'active').length;
  const pendingProviders = providers.filter((p: any) => p.status === 'pending').length;
  const suspendedProviders = providers.filter((p: any) => p.status === 'suspended').length;
  const newProviders = providers.filter((p: any) => {
    const createdDate = new Date(p.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return createdDate >= monthAgo;
  }).length;

  const providerData = [
    { category: "Actifs", count: activeProviders, percentage: Math.round((activeProviders / providers.length) * 100) },
    { category: "En attente", count: pendingProviders, percentage: Math.round((pendingProviders / providers.length) * 100) },
    { category: "Suspendus", count: suspendedProviders, percentage: Math.round((suspendedProviders / providers.length) * 100) },
    { category: "Nouveaux", count: newProviders, percentage: Math.round((newProviders / providers.length) * 100) }
  ];

  // Calculate provider metrics
  const totalAcceptanceRate = providers.length > 0 
    ? providers.reduce((sum: number, p: any) => sum + (p.acceptance_rate || 0), 0) / providers.length 
    : 0;
  
  const totalRating = providers.length > 0 
    ? providers.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / providers.length 
    : 0;

  return {
    kpis: {
      totalRevenue,
      totalBookings: totalBookingsCount,
      activeProviders,
      averageBasket
    },
    financial: {
      monthlyData,
      servicesRevenue: servicesArray
    },
    services: {
      distribution: servicesArray,
      performance: servicesArray
    },
    providers: {
      statusDistribution: providerData,
      metrics: {
        acceptanceRate: Math.round(totalAcceptanceRate),
        averageRating: Math.round(totalRating * 10) / 10,
        averageResponseTime: '2.3h', // Mock for now
        retentionRate: 92 // Mock for now
      }
    },
    clients: {
      activeClients: Math.floor(totalBookingsCount * 0.7), // Estimation
      retentionRate: 68,
      averageBasket,
      ordersPerMonth: 3.2
    }
  };
}