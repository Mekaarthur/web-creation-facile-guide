import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BinomesDashboard } from "@/components/admin/binomes/BinomesDashboard";
import { MatchingAlgorithm } from "@/components/admin/binomes/MatchingAlgorithm";
import { BinomesManagement } from "@/components/admin/binomes/BinomesManagement";
import { BinomesAlerts } from "@/components/admin/binomes/BinomesAlerts";
import { BinomesMetrics } from "@/components/admin/binomes/BinomesMetrics";

const AdminBinomes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Binômes Client-Prestataire</h1>
        <p className="text-muted-foreground">
          Gestion des relations privilégiées entre clients et prestataires
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="management">Gestion</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <BinomesDashboard />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <MatchingAlgorithm />
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <BinomesManagement />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <BinomesAlerts />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <BinomesMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBinomes;