import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CreditCard, Upload, CheckCircle, AlertCircle, Clock, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

const SystemHealthCheck = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const testEmailConfirmation = async () => {
    const startTime = Date.now();
    updateTestResult('Email Confirmation', 'running', 'Test de l\'envoi d\'emails...');
    
    try {
      // Test d'envoi d'email de confirmation
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: 'test@example.com',
          user_id: 'test-user-id',
          action: 'test_confirmation'
        }
      });

      if (error) {
        updateTestResult('Email Confirmation', 'error', `Erreur: ${error.message}`, Date.now() - startTime);
      } else {
        updateTestResult('Email Confirmation', 'success', 'Service d\'email opérationnel', Date.now() - startTime);
      }
    } catch (error: any) {
      updateTestResult('Email Confirmation', 'error', `Erreur critique: ${error.message}`, Date.now() - startTime);
    }
  };

  const testStripePayment = async () => {
    const startTime = Date.now();
    updateTestResult('Stripe Payment', 'running', 'Test de l\'intégration Stripe...');
    
    try {
      // Test de création de session de paiement
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: 1000, // 10€ en centimes
          currency: 'EUR',
          test_mode: true,
          service_name: 'Test Service'
        }
      });

      if (error) {
        updateTestResult('Stripe Payment', 'error', `Erreur Stripe: ${error.message}`, Date.now() - startTime);
      } else if (data?.url) {
        updateTestResult('Stripe Payment', 'success', 'Intégration Stripe fonctionnelle', Date.now() - startTime);
      } else {
        updateTestResult('Stripe Payment', 'error', 'Réponse Stripe invalide', Date.now() - startTime);
      }
    } catch (error: any) {
      updateTestResult('Stripe Payment', 'error', `Erreur critique Stripe: ${error.message}`, Date.now() - startTime);
    }
  };

  const testFileUpload = async () => {
    const startTime = Date.now();
    updateTestResult('File Upload', 'running', 'Test des uploads de fichiers...');
    
    try {
      // Test d'upload d'un fichier test
      const testFile = new Blob(['Test file content'], { type: 'text/plain' });
      const fileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .upload(`test/${fileName}`, testFile);

      if (error) {
        updateTestResult('File Upload', 'error', `Erreur upload: ${error.message}`, Date.now() - startTime);
      } else {
        // Nettoyer le fichier test
        await supabase.storage
          .from('provider-documents')
          .remove([`test/${fileName}`]);
        
        updateTestResult('File Upload', 'success', 'Système d\'upload opérationnel', Date.now() - startTime);
      }
    } catch (error: any) {
      updateTestResult('File Upload', 'error', `Erreur critique upload: ${error.message}`, Date.now() - startTime);
    }
  };

  const testDatabaseConnectivity = async () => {
    const startTime = Date.now();
    updateTestResult('Database', 'running', 'Test de connectivité base de données...');
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('count')
        .limit(1);

      if (error) {
        updateTestResult('Database', 'error', `Erreur DB: ${error.message}`, Date.now() - startTime);
      } else {
        updateTestResult('Database', 'success', 'Base de données accessible', Date.now() - startTime);
      }
    } catch (error: any) {
      updateTestResult('Database', 'error', `Erreur critique DB: ${error.message}`, Date.now() - startTime);
    }
  };

  const testNotificationSystem = async () => {
    const startTime = Date.now();
    updateTestResult('Notifications', 'running', 'Test du système de notifications...');
    
    try {
      const { data, error } = await supabase.functions.invoke('send-automated-notification', {
        body: {
          type: 'system_test',
          recipient_email: 'admin@bikawo.com',
          title: 'Test système',
          message: 'Test automatique du système de notifications'
        }
      });

      if (error) {
        updateTestResult('Notifications', 'error', `Erreur notifications: ${error.message}`, Date.now() - startTime);
      } else {
        updateTestResult('Notifications', 'success', 'Système de notifications opérationnel', Date.now() - startTime);
      }
    } catch (error: any) {
      updateTestResult('Notifications', 'error', `Erreur critique notifications: ${error.message}`, Date.now() - startTime);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    toast({
      title: "Tests système lancés",
      description: "Vérification de toutes les fonctionnalités...",
    });

    // Lancer tous les tests en parallèle
    await Promise.all([
      testDatabaseConnectivity(),
      testEmailConfirmation(),
      testStripePayment(),
      testFileUpload(),
      testNotificationSystem()
    ]);

    setIsRunning(false);
    
    const hasErrors = testResults.some(t => t.status === 'error');
    toast({
      title: hasErrors ? "Tests terminés avec erreurs" : "Tous les tests réussis",
      description: hasErrors ? 
        "Certaines fonctionnalités nécessitent une attention" : 
        "Tous les systèmes sont opérationnels",
      variant: hasErrors ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: { variant: 'default' as const, label: 'Réussi', className: 'bg-green-100 text-green-800' },
      error: { variant: 'destructive' as const, label: 'Erreur', className: 'bg-red-100 text-red-800' },
      running: { variant: 'secondary' as const, label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      pending: { variant: 'outline' as const, label: 'En attente', className: 'bg-gray-100 text-gray-800' }
    };

    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Vérification Système
          </CardTitle>
          <CardDescription>
            Tests automatiques des fonctionnalités critiques du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full mb-6"
          >
            {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
          </Button>

          <div className="space-y-4">
            {testResults.map((result) => (
              <Card key={result.name} className="border-l-4" style={{
                borderLeftColor: 
                  result.status === 'success' ? '#10b981' :
                  result.status === 'error' ? '#ef4444' :
                  result.status === 'running' ? '#3b82f6' : '#6b7280'
              }}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.duration && (
                          <p className="text-xs text-muted-foreground">
                            Durée: {result.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {testResults.length === 0 && !isRunning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cliquez sur "Lancer tous les tests" pour vérifier l'état des systèmes
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests Individuels</CardTitle>
          <CardDescription>
            Lancez des tests spécifiques pour chaque fonctionnalité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={testEmailConfirmation}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Test Email
            </Button>
            
            <Button
              variant="outline"
              onClick={testStripePayment}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Test Stripe
            </Button>
            
            <Button
              variant="outline"
              onClick={testFileUpload}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Test Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthCheck;