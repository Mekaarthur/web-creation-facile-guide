import AdminParametres from "./Parametres";
import FinancialRulesManager from "@/components/admin/FinancialRulesManager";
import FinancialReporting from "@/components/admin/FinancialReporting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettings = () => {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">Paramètres Généraux</TabsTrigger>
        <TabsTrigger value="financial">Règles Financières</TabsTrigger>
        <TabsTrigger value="reporting">Reporting Financier</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <AdminParametres />
      </TabsContent>
      <TabsContent value="financial">
        <FinancialRulesManager />
      </TabsContent>
      <TabsContent value="reporting">
        <FinancialReporting />
      </TabsContent>
    </Tabs>
  );
};

export default AdminSettings;