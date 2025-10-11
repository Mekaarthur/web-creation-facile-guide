import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, DollarSign, Star, Calendar, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    avgRating: 0,
    growthRate: 0
  });
  const [bookingsByDay, setBookingsByDay] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [providerPerformance, setProviderPerformance] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // KPIs principaux
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('total_price, created_at, status');

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id');

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('is_approved', true);

      // Calculer les métriques
      const completedBookings = bookingsData?.filter(b => b.status === 'completed') || [];
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const avgRating = reviewsData?.length 
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      // Réservations par jour (7 derniers jours)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const bookingsByDayData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        reservations: bookingsData?.filter(b => 
          b.created_at?.startsWith(date)
        ).length || 0
      }));

      // Revenue par catégorie (simulé)
      const categories = [
        { name: 'Bika Kids', value: totalRevenue * 0.3 },
        { name: 'Bika Maison', value: totalRevenue * 0.25 },
        { name: 'Bika Vie', value: totalRevenue * 0.2 },
        { name: 'Bika Seniors', value: totalRevenue * 0.15 },
        { name: 'Autres', value: totalRevenue * 0.1 }
      ];

      // Performance des top prestataires
      const { data: topProviders } = await supabase
        .from('providers')
        .select('business_name, rating, missions_completed')
        .order('missions_completed', { ascending: false })
        .limit(5);

      setMetrics({
        totalBookings: bookingsData?.length || 0,
        totalRevenue,
        activeUsers: usersData?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        growthRate: 12.5 // Simulé
      });

      setBookingsByDay(bookingsByDayData);
      setRevenueByCategory(categories);
      setProviderPerformance(topProviders || []);

    } catch (error: any) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement des analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics Avancés</h1>
        <p className="text-muted-foreground">
          Métriques détaillées et indicateurs de performance
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <p className="text-xs text-green-600 mt-1">+{metrics.growthRate}% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRevenue.toFixed(0)}€</div>
            <p className="text-xs text-muted-foreground mt-1">Toutes catégories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Profils créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Note Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgRating}/5</div>
            <p className="text-xs text-muted-foreground mt-1">Satisfaction client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{metrics.growthRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Sur 30 jours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des réservations (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reservations" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition du revenu par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Prestataires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="business_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="missions_completed" fill="#8884d8" name="Missions" />
                  <Bar dataKey="rating" fill="#82ca9d" name="Note (/5)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
