import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Eye, 
  Users, 
  Search, 
  Target, 
  FileText, 
  MousePointer, 
  Phone,
  Euro,
  BarChart3,
  Calendar,
  Globe,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

interface SEOMetrics {
  organic_traffic: number;
  keywords_ranked: number;
  backlinks: number;
  domain_authority: number;
  conversions: number;
  conversion_rate: number;
  average_position: number;
  click_through_rate: number;
}

interface ContentMetrics {
  blog_views: number;
  time_on_page: number;
  bounce_rate: number;
  social_shares: number;
  lead_generation: number;
}

const SEODashboard = () => {
  const [seoData, setSeoData] = useState<SEOMetrics>({
    organic_traffic: 2450,
    keywords_ranked: 127,
    backlinks: 89,
    domain_authority: 35,
    conversions: 23,
    conversion_rate: 2.8,
    average_position: 12.5,
    click_through_rate: 3.2
  });

  const [contentData, setContentData] = useState<ContentMetrics>({
    blog_views: 1200,
    time_on_page: 4.5,
    bounce_rate: 45,
    social_shares: 67,
    lead_generation: 15
  });

  const kpiCards = [
    {
      title: "Trafic Organique",
      value: seoData.organic_traffic.toLocaleString(),
      change: "+23%",
      icon: TrendingUp,
      color: "text-green-600",
      description: "Sessions mensuelles SEO"
    },
    {
      title: "Mots-clés Positionnés",
      value: seoData.keywords_ranked,
      change: "+15 mots-clés",
      icon: Search,
      color: "text-blue-600",
      description: "Dans le top 100 Google"
    },
    {
      title: "Conversions SEO",
      value: seoData.conversions,
      change: "+35%",
      icon: Target,
      color: "text-purple-600",
      description: "Leads qualifiés mensuels"
    },
    {
      title: "Taux de Conversion",
      value: `${seoData.conversion_rate}%`,
      change: "+0.5%",
      icon: MousePointer,
      color: "text-orange-600",
      description: "Visiteurs → Clients"
    }
  ];

  const contentKPIs = [
    {
      title: "Vues Blog",
      value: contentData.blog_views.toLocaleString(),
      change: "+45%",
      icon: Eye,
      description: "Pages vues mensuelles"
    },
    {
      title: "Temps sur Page",
      value: `${contentData.time_on_page}min`,
      change: "+12%",
      icon: FileText,
      description: "Engagement moyen"
    },
    {
      title: "Leads Blog",
      value: contentData.lead_generation,
      change: "+8 leads",
      icon: Users,
      description: "Newsletter + Contact"
    },
    {
      title: "Partages Sociaux",
      value: contentData.social_shares,
      change: "+25%",
      icon: Globe,
      description: "Viralité du contenu"
    }
  ];

  const keywordTracking = [
    { keyword: "charge mentale", position: 8, volume: 2900, difficulty: 65, trend: "up" },
    { keyword: "préparation culinaire Paris", position: 15, volume: 1200, difficulty: 58, trend: "up" },
    { keyword: "garde enfants domicile", position: 22, volume: 800, difficulty: 72, trend: "down" },
    { keyword: "déléguer sans culpabiliser", position: 3, volume: 400, difficulty: 35, trend: "up" },
    { keyword: "assistant familial", position: 18, volume: 600, difficulty: 45, trend: "stable" }
  ];

  const competitorAnalysis = [
    { competitor: "Babysits", da: 65, keywords: 1200, traffic: "125K", gap: "Faible blog" },
    { competitor: "Wecasa", da: 58, keywords: 980, traffic: "89K", gap: "Pas de charge mentale" },
    { competitor: "Yoopies", da: 72, keywords: 1500, traffic: "156K", gap: "Services séparés" },
    { competitor: "Helpling", da: 55, keywords: 750, traffic: "67K", gap: "Que préparation culinaire" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard SEO Bikawo</h1>
          <p className="text-muted-foreground">Mesure et optimisation des performances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            30 derniers jours
          </Button>
          <Button size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Rapport complet
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-sm">
                <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-600">{kpi.change}</span>
                <span className="text-muted-foreground ml-2">vs mois dernier</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="seo">SEO Global</TabsTrigger>
          <TabsTrigger value="content">Content Marketing</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="competitors">Concurrence</TabsTrigger>
          <TabsTrigger value="tools">Outils Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métriques techniques */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Technique</CardTitle>
                <CardDescription>Santé SEO du site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Domain Authority</span>
                  <Badge variant="secondary">{seoData.domain_authority}/100</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Backlinks</span>
                  <Badge variant="outline">{seoData.backlinks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Position moyenne</span>
                  <Badge variant="secondary">{seoData.average_position}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>CTR moyen</span>
                  <Badge variant="outline">{seoData.click_through_rate}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* ROI et conversions */}
            <Card>
              <CardHeader>
                <CardTitle>ROI et Conversions</CardTitle>
                <CardDescription>Impact business du SEO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Coût acquisition SEO</span>
                  <Badge variant="secondary">12€</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Valeur vie client</span>
                  <Badge variant="outline">890€</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>ROI SEO</span>
                  <Badge className="bg-green-100 text-green-800">740%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>CA attribué SEO</span>
                  <Badge variant="secondary">2.450€/mois</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentKPIs.map((kpi, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="flex items-center text-sm text-green-600">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {kpi.change}
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance des Articles</CardTitle>
              <CardDescription>TOP performers du blog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">10 signes charge mentale</p>
                    <p className="text-sm text-muted-foreground">456 vues • 8 leads</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Top performer</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">Guide déléguer sans culpabiliser</p>
                    <p className="text-sm text-muted-foreground">334 vues • 5 leads</p>
                  </div>
                  <Badge variant="secondary">Bon</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">Coût aide ménagère vs temps</p>
                    <p className="text-sm text-muted-foreground">289 vues • 4 leads</p>
                  </div>
                  <Badge variant="outline">Moyen</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Mots-clés Stratégiques</CardTitle>
              <CardDescription>Positions et opportunités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywordTracking.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{keyword.keyword}</p>
                      <p className="text-sm text-muted-foreground">
                        {keyword.volume.toLocaleString()} recherches/mois
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Position {keyword.position}</Badge>
                      <Badge variant="secondary">Diff. {keyword.difficulty}</Badge>
                      <div className={`w-2 h-2 rounded-full ${
                        keyword.trend === 'up' ? 'bg-green-500' : 
                        keyword.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Concurrentielle</CardTitle>
              <CardDescription>Positionnement vs concurrents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorAnalysis.map((comp, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{comp.competitor}</p>
                      <p className="text-sm text-muted-foreground">
                        Opportunité: {comp.gap}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>DA: {comp.da}</span>
                      <span>{comp.keywords} mots-clés</span>
                      <span>{comp.traffic} trafic</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Outils Analytics</CardTitle>
                <CardDescription>Configuration et statut</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Google Analytics 4</span>
                  <Badge variant="outline">À configurer</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Search Console</span>
                  <Badge variant="outline">À configurer</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sitemap.xml</span>
                  <Badge className="bg-green-100 text-green-800">Actif</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Structured Data</span>
                  <Badge className="bg-green-100 text-green-800">Actif</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outils SEO Externes</CardTitle>
                <CardDescription>Recommandations monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>SEMrush / Ahrefs</span>
                  <Badge variant="secondary">Recommandé</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>GTmetrix</span>
                  <Badge variant="secondary">Performance</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Screaming Frog</span>
                  <Badge variant="secondary">Audit technique</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hotjar</span>
                  <Badge variant="secondary">UX Analytics</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Actions Prioritaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded bg-orange-50">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Configurer Google Analytics avec votre ID</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded bg-orange-50">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Ajouter Search Console verification</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded bg-blue-50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Publier articles blog supplémentaires</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded bg-green-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Optimiser pour "assistant familial Paris"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEODashboard;