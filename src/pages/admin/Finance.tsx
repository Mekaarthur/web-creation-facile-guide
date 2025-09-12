import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, AlertCircle, Download, Calendar } from "lucide-react";

const AdminFinance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { toast } = useToast();

  const financeStats = [
    { label: "Chiffre d'affaires", value: "€24,580", change: "+12.5%", trend: "up", icon: DollarSign },
    { label: "Commissions", value: "€7,374", change: "+8.2%", trend: "up", icon: CreditCard },
    { label: "Paiements en attente", value: "€1,420", change: "-15%", trend: "down", icon: Receipt },
    { label: "Remboursements", value: "€340", change: "+5%", trend: "up", icon: AlertCircle }
  ];

  const recentTransactions = [
    { id: 1, type: "Paiement", client: "Marie D.", amount: "€85.00", service: "Ménage", status: "completed", date: "Aujourd'hui" },
    { id: 2, type: "Commission", provider: "Jean M.", amount: "€25.50", service: "Jardinage", status: "pending", date: "Hier" },
    { id: 3, type: "Remboursement", client: "Sophie L.", amount: "-€45.00", service: "Garde d'enfants", status: "processed", date: "2 jours" },
    { id: 4, type: "Paiement", client: "Paul R.", amount: "€120.00", service: "Réparations", status: "completed", date: "3 jours" }
  ];

  const pendingPayments = [
    { id: 1, provider: "Anne M.", amount: "€156.50", missions: 3, dueDate: "Dans 2 jours" },
    { id: 2, provider: "Pierre D.", amount: "€89.25", missions: 2, dueDate: "Dans 4 jours" },
    { id: 3, provider: "Claire B.", amount: "€203.00", missions: 4, dueDate: "Dans 1 semaine" }
  ];

  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Les données financières sont en cours d'export"
    });
  };

  const handleProcessPayment = (id: number, provider: string) => {
    toast({
      title: "Paiement traité",
      description: `Le paiement pour ${provider} a été traité avec succès`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Vue d'ensemble financière et comptabilité</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {financeStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Paiements en attente</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Transactions récentes
              </CardTitle>
              <CardDescription>
                Historique des dernières transactions financières
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' : 
                        transaction.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.client || transaction.provider} - {transaction.service}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Paiements prestataires en attente
              </CardTitle>
              <CardDescription>
                Rémunérations à verser aux prestataires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.missions} missions - Échéance: {payment.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-green-600">{payment.amount}</p>
                        <Badge variant="outline">En attente</Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleProcessPayment(payment.id, payment.provider)}
                      >
                        Payer
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total à payer:</span>
                    <span className="text-lg font-bold text-green-600">€448.75</span>
                  </div>
                  <Button className="w-full mt-4">
                    Traiter tous les paiements
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Rapports financiers
              </CardTitle>
              <CardDescription>
                Générer et consulter les rapports financiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Receipt className="w-6 h-6 mb-2" />
                  Rapport mensuel
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Analyse des tendances
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Bilan comptable
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  Export CSV/PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinance;