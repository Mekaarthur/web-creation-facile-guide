import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  upcomingBookings: number;
  totalServices: number;
  totalSpent: number;
  averageRating: number;
  completedBookings: number;
  savedAmount: number; // Crédit d'impôt économisé
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  count?: number;
  urgent?: boolean;
}

export const useClientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  // Statistiques du dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['client-dashboard-stats', user?.id, refreshKey],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('User not authenticated');

      // Récupérer les réservations
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name, price)')
        .eq('client_id', user.id);

      // Récupérer les évaluations
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('client_id', user.id);

      const upcomingBookings = bookings?.filter(b => 
        b.status === 'confirmed' && new Date(b.booking_date) > new Date()
      ).length || 0;

      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const totalSpent = bookings?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      const averageRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      // Services uniques utilisés
      const uniqueServices = new Set(bookings?.map(b => b.service_id)).size;

      // Crédit d'impôt économisé (50% des services éligibles)
      const savedAmount = totalSpent * 0.5;

      return {
        upcomingBookings,
        totalServices: uniqueServices,
        totalSpent,
        averageRating,
        completedBookings,
        savedAmount
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    refetchOnWindowFocus: false,
  });

  // Réservations à venir
  const { data: upcomingBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['upcoming-bookings', user?.id, refreshKey],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, category),
          providers(
            business_name,
            profiles(first_name, last_name, avatar_url)
          )
        `)
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'assigned'])
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .limit(5);

      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Actions rapides
  const { data: quickActions } = useQuery({
    queryKey: ['quick-actions', user?.id],
    queryFn: async (): Promise<QuickAction[]> => {
      if (!user) return [];

      // Récupérer les données pour les compteurs
      const [bookingsData, invoicesData] = await Promise.all([
        supabase.from('bookings').select('id, status').eq('client_id', user.id),
        supabase.from('invoices').select('id, status').eq('client_id', user.id)
      ]);

      const pendingBookings = bookingsData.data?.filter(b => b.status === 'pending').length || 0;
      const unpaidInvoices = invoicesData.data?.filter(i => i.status === 'pending').length || 0;
      const rewardPoints = 0; // Points de fidélité à implémenter plus tard

      return [
        {
          id: 'new-booking',
          title: 'Nouvelle réservation',
          description: 'Réserver un service',
          icon: 'Calendar',
          action: () => window.location.href = '/services',
        },
        {
          id: 'pending-bookings',
          title: 'Réservations en attente',
          description: 'Gérer vos demandes',
          icon: 'Clock',
          action: () => {},
          count: pendingBookings,
          urgent: pendingBookings > 0,
        },
        {
          id: 'unpaid-invoices',
          title: 'Factures impayées',
          description: 'Régler vos factures',
          icon: 'CreditCard',
          action: () => {},
          count: unpaidInvoices,
          urgent: unpaidInvoices > 0,
        },
        {
          id: 'rewards',
          title: 'Points fidélité',
          description: 'Utiliser vos points',
          icon: 'Gift',
          action: () => {},
          count: rewardPoints,
        },
      ];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Notifications intelligentes
  const { data: notifications } = useQuery({
    queryKey: ['smart-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const notifications = [];
      
      // Vérifier les réservations à venir dans 24h
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: tomorrowBookings } = await supabase
        .from('bookings')
        .select('*, services(name)')
        .eq('client_id', user.id)
        .eq('status', 'confirmed')
        .gte('booking_date', tomorrow.toISOString().split('T')[0])
        .lt('booking_date', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (tomorrowBookings?.length) {
        notifications.push({
          id: 'upcoming-booking',
          type: 'info',
          title: 'Réservation demain',
          message: `Vous avez ${tomorrowBookings.length} réservation(s) prévue(s) demain`,
          action: 'Voir détails',
        });
      }

      return notifications;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
  });

  // Fonction de rafraîchissement des données
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['client-dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] });
    toast({
      title: "Données actualisées",
      description: "Vos informations ont été mises à jour",
    });
  }, [queryClient, toast]);

  // Auto-refresh toutes les 10 minutes si la page est active
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    stats,
    statsLoading,
    upcomingBookings,
    bookingsLoading,
    quickActions,
    notifications,
    refreshData,
    isLoading: statsLoading || bookingsLoading,
  };
};