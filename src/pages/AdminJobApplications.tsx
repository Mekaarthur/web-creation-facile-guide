import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Award,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface JobApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  experience_years: number;
  availability: string;
  motivation: string;
  has_transport: boolean;
  certifications: string;
  status: string;
  created_at: string;
}

const AdminJobApplications = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les candidatures"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status } : app
        )
      );

      toast({
        title: "Statut mis à jour",
        description: `Candidature marquée comme ${status}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Candidatures d'emploi - Admin Bikawo</title>
        <meta name="description" content="Gestion des candidatures d'emploi" />
      </Helmet>

      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('admin.jobApplications')}
            </h1>
            <p className="text-muted-foreground">
              Gérez les candidatures reçues pour les postes de prestataires
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="w-8 h-8 text-primary mr-4" />
                <div>
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-muted-foreground">Total candidatures</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="w-8 h-8 text-yellow-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{pendingApplications.length}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.newApplications')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter(app => app.status === 'approved').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <XCircle className="w-8 h-8 text-red-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter(app => app.status === 'rejected').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejetées</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des candidatures */}
          <Card>
            <CardHeader>
              <CardTitle>Candidatures récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune candidature trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold">
                              {application.first_name} {application.last_name}
                            </h3>
                            <Badge className={getStatusColor(application.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(application.status)}
                                {t(`admin.${application.status}`)}
                              </span>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {application.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {application.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              {application.category}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {application.experience_years} ans d'expérience • {application.availability}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedApplication(application)}
                              >
                                {t('admin.viewDetails')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Candidature de {selectedApplication?.first_name} {selectedApplication?.last_name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {selectedApplication && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Informations personnelles</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</p>
                                        <p><strong>Email:</strong> {selectedApplication.email}</p>
                                        <p><strong>Téléphone:</strong> {selectedApplication.phone}</p>
                                        <p><strong>Transport:</strong> {selectedApplication.has_transport ? 'Oui' : 'Non'}</p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold mb-2">Expérience professionnelle</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>Catégorie:</strong> {selectedApplication.category}</p>
                                        <p><strong>Expérience:</strong> {selectedApplication.experience_years} ans</p>
                                        <p><strong>Disponibilité:</strong> {selectedApplication.availability}</p>
                                        {selectedApplication.certifications && (
                                          <p><strong>Certifications:</strong> {selectedApplication.certifications}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Motivation</h4>
                                    <p className="text-sm bg-muted p-3 rounded-lg">
                                      {selectedApplication.motivation}
                                    </p>
                                  </div>
                                  
                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approuver
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Rejeter
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {application.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminJobApplications;