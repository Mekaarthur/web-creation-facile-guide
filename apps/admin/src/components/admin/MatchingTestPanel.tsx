import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

const MatchingTestPanel = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: '1', name: 'Test Scoring Multi-critères', status: 'pending', message: 'En attente' },
    { id: '2', name: 'Test Attribution Cascade', status: 'pending', message: 'En attente' },
    { id: '3', name: 'Test Timeout & Backup', status: 'pending', message: 'En attente' },
    { id: '4', name: 'Test Charge Multiple', status: 'pending', message: 'En attente' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [requests, setRequests] = useState<any[]>([]);

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const testScoring = async () => {
    const startTime = Date.now();
    updateTestResult('1', { status: 'running', message: 'Test en cours...' });

    try {
      // Test avec une demande réelle ou créer une demande test
      const { data: testRequest, error: requestError } = await supabase
        .from('client_requests')
        .select('*')
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (requestError) throw new Error('Aucune demande en attente pour tester');

      const { data, error } = await supabase.functions.invoke('intelligent-matching', {
        body: { 
          requestId: testRequest.id,
          mode: 'test' // Mode test pour ne pas effectuer d'attribution réelle
        }
      });

      if (error) throw error;

      const duration = Date.now() - startTime;
      updateTestResult('1', { 
        status: 'success', 
        message: `Scoring calculé: ${data.providers?.length || 0} prestataires évalués`,
        duration 
      });
    } catch (error: any) {
      updateTestResult('1', { 
        status: 'error', 
        message: error.message 
      });
    }
  };

  const testCascade = async () => {
    const startTime = Date.now();
    updateTestResult('2', { status: 'running', message: 'Test en cours...' });

    try {
      const { data, error } = await supabase.functions.invoke('intelligent-matching', {
        body: { 
          requestId: selectedRequest,
          mode: 'cascade_test'
        }
      });

      if (error) throw error;

      const duration = Date.now() - startTime;
      updateTestResult('2', { 
        status: 'success', 
        message: `Cascade: ${data.assignmentOrder?.length || 0} prestataires dans l'ordre`,
        duration 
      });
    } catch (error: any) {
      updateTestResult('2', { 
        status: 'error', 
        message: error.message 
      });
    }
  };

  const testTimeout = async () => {
    const startTime = Date.now();
    updateTestResult('3', { status: 'running', message: 'Test en cours...' });

    try {
      // Vérifier les demandes anciennes
      const { data: oldRequests, error } = await supabase
        .from('client_requests')
        .select('*, created_at')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const duration = Date.now() - startTime;
      updateTestResult('3', { 
        status: 'success', 
        message: `${oldRequests.length} demandes anciennes détectées (>2h)`,
        duration 
      });
    } catch (error: any) {
      updateTestResult('3', { 
        status: 'error', 
        message: error.message 
      });
    }
  };

  const testLoad = async () => {
    const startTime = Date.now();
    updateTestResult('4', { status: 'running', message: 'Test en cours...' });

    try {
      // Simuler plusieurs attributions simultanées
      const { data: pendingRequests, error } = await supabase
        .from('client_requests')
        .select('id')
        .eq('status', 'pending')
        .limit(5);

      if (error) throw error;

      const promises = pendingRequests.map(req => 
        supabase.functions.invoke('intelligent-matching', {
          body: { requestId: req.id, mode: 'test' }
        })
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      updateTestResult('4', { 
        status: 'success', 
        message: `${promises.length} attributions simultanées testées`,
        duration 
      });
    } catch (error: any) {
      updateTestResult('4', { 
        status: 'error', 
        message: error.message 
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    toast({
      title: "Tests lancés",
      description: "Exécution de tous les tests de matching...",
    });

    try {
      await testScoring();
      await testCascade();
      await testTimeout();
      await testLoad();

      toast({
        title: "Tests terminés",
        description: "Tous les tests de matching ont été exécutés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors des tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline',
    } as const;

    const labels = {
      success: 'Réussi',
      error: 'Échec',
      running: 'En cours',
      pending: 'En attente',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Lancer tous les tests
        </Button>
      </div>

      <div className="space-y-4">
        {testResults.map((test) => (
          <Card key={test.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {test.duration && (
                  <span className="text-sm text-muted-foreground">
                    {test.duration}ms
                  </span>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-medium mb-3">Tests individuels</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={testScoring}
            disabled={isRunning}
            className="justify-start"
          >
            Test Scoring
          </Button>
          <Button 
            variant="outline" 
            onClick={testCascade}
            disabled={isRunning}
            className="justify-start"
          >
            Test Cascade
          </Button>
          <Button 
            variant="outline" 
            onClick={testTimeout}
            disabled={isRunning}
            className="justify-start"
          >
            Test Timeout
          </Button>
          <Button 
            variant="outline" 
            onClick={testLoad}
            disabled={isRunning}
            className="justify-start"
          >
            Test Charge
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MatchingTestPanel;
