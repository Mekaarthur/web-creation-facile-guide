import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemHealthCheck from '@/components/admin/SystemHealthCheck';
import EmailTestingDashboard from '@/components/admin/EmailTestingDashboard';
import MatchingTestPanel from '@/components/admin/MatchingTestPanel';
import SecurityTestPanel from '@/components/admin/SecurityTestPanel';
import { Shield, Mail, Zap, Server } from 'lucide-react';

const TestsCritiques = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tests Critiques</h1>
        <p className="text-muted-foreground">
          Exécutez et surveillez tous les tests critiques du système avant le lancement
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="matching" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Matching IA
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Système</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tests de connectivité base de données, envoi d'emails, Stripe et uploads
            </p>
            <SystemHealthCheck />
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Emails Transactionnels</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Testez tous les templates d'emails transactionnels
            </p>
            <EmailTestingDashboard />
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Matching IA</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Testez l'algorithme de matching et d'attribution automatique
            </p>
            <MatchingTestPanel />
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Sécurité</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Vérifiez les politiques RLS, rate limiting et validation des entrées
            </p>
            <SecurityTestPanel />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestsCritiques;
