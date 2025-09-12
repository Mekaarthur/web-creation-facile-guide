import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, Calendar, TrendingUp, Users, Euro, FileText, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminReportsData = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { 
          action: 'get_reports',
          timeRange: selectedPeriod 
        }
      });

      if (error) throw error;
      setReportsData(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const handleExport = (type: string) => {
    console.log(`Exporting ${type} report...`);
    toast.success(`Export ${type} en cours...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">Analyses et rapports détaillés</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => handleExport('global')}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{reportsData?.kpis?.totalRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData?.kpis?.totalBookings?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestataires actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData?.kpis?.activeProviders || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.8%</span> vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{reportsData?.kpis?.averageBasket?.toFixed(2) || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+4.1%</span> vs période précédente
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
                <CardDescription>Revenus et nombre de réservations par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportsData?.financial?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'value' ? `€${value}` : value,
                        name === 'value' ? 'Revenus' : 'Réservations'
                      ]}
                    />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="bookings" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par service</CardTitle>
                <CardDescription>Répartition des revenus par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportsData?.financial?.servicesRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}`, "Revenus"]} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Exportation de rapports financiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('revenue')}
                  className="flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport revenus
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('transactions')}
                  className="flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('commissions')}
                  className="flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des services</CardTitle>
                <CardDescription>Pourcentage d'utilisation par service</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportsData?.services?.distribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {(reportsData?.services?.distribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance par service</CardTitle>
                <CardDescription>Statistiques détaillées par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reportsData?.services?.performance || []).map((service: any) => (
                    <div key={service.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-muted-foreground">€{service.revenue?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${service.value || 0}%`,
                            backgroundColor: service.color || '#8884d8'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statut des prestataires</CardTitle>
                <CardDescription>Répartition par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reportsData?.providers?.statusDistribution || []).map((item: any) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques prestataires</CardTitle>
                <CardDescription>Indicateurs de performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Taux d'acceptation moyen</span>
                    <span className="font-bold text-green-600">{reportsData?.providers?.metrics?.acceptanceRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Note moyenne</span>
                    <span className="font-bold text-yellow-600">{reportsData?.providers?.metrics?.averageRating || 0}/5</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Temps de réponse moyen</span>
                    <span className="font-bold text-blue-600">{reportsData?.providers?.metrics?.averageResponseTime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Taux de rétention</span>
                    <span className="font-bold text-purple-600">{reportsData?.providers?.metrics?.retentionRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des clients</CardTitle>
              <CardDescription>Métriques et comportements clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportsData?.clients?.activeClients || 0}</div>
                  <div className="text-sm text-muted-foreground">Clients actifs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reportsData?.clients?.retentionRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Taux de rétention</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">€{reportsData?.clients?.averageBasket?.toFixed(2) || '0'}</div>
                  <div className="text-sm text-muted-foreground">Panier moyen</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportsData?.clients?.ordersPerMonth || 0}</div>
                  <div className="text-sm text-muted-foreground">Commandes/mois</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsData;