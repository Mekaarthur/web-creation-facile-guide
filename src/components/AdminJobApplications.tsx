import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Calendar,
  User,
  Users,
  FileCheck,
  XCircle,
  Shield,
  Video,
  Send
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface JobApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  availability: string;
  motivation: string;
  experience_years: number | null;
  certifications: string | null;
  has_transport: boolean;
  cv_file_url: string | null;
  status: string;
  admin_comments: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminJobApplications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [adminComments, setAdminComments] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, [searchTerm, statusFilter, categoryFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          admin_comments: comments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Envoyer email de notification selon le statut
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        await sendStatusNotification(application, newStatus);
      }

      toast({
        title: "Statut mis à jour",
        description: `La candidature a été marquée comme ${getStatusLabel(newStatus)}`,
      });

      setApplications(applications.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, admin_comments: comments || app.admin_comments }
          : app
      ));
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const sendStatusNotification = async (application: JobApplication, status: string) => {
    try {
      const messages = {
        'pending': "Nous avons bien reçu votre candidature.",
        'documents_required': "Merci d'envoyer les documents manquants.",
        'interview_scheduled': `Votre entretien est prévu. Nous vous contacterons bientôt.`,
        'approved': "Bienvenue sur Bikawo ! Votre profil est activé.",
        'rejected': "Nous ne pouvons pas donner suite à votre candidature.",
        'under_review': "Nous avons noté des problèmes sur vos prestations, merci de nous contacter."
      };

      await supabase.functions.invoke('send-job-status-notification', {
        body: {
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
          status: status,
          message: messages[status as keyof typeof messages] || 'Mise à jour de votre candidature'
        }
      });
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      documents_required: applications.filter(a => a.status === 'documents_required').length,
      interview_scheduled: applications.filter(a => a.status === 'interview_scheduled').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      active: applications.filter(a => a.status === 'active').length,
      under_review: applications.filter(a => a.status === 'under_review').length,
    };
    return stats;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'documents_required': return 'outline';
      case 'interview_scheduled': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'active': return 'default';
      case 'under_review': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Nouvelle candidature';
      case 'documents_required': return 'En attente documents';
      case 'interview_scheduled': return 'En entretien/test';
      case 'approved': return 'Validé';
      case 'rejected': return 'Refusé';
      case 'active': return 'Actif';
      case 'under_review': return 'Sous surveillance';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <User className="w-4 h-4" />;
      case 'documents_required': return <FileText className="w-4 h-4" />;
      case 'interview_scheduled': return <Video className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'active': return <Users className="w-4 h-4" />;
      case 'under_review': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleScheduleInterview = async (applicationId: string) => {
    await handleStatusUpdate(applicationId, 'interview_scheduled', 'Entretien programmé');
  };

  const handleRequestDocuments = async (applicationId: string) => {
    await handleStatusUpdate(applicationId, 'documents_required', 'Documents manquants demandés');
  };

  const handleApprove = async (applicationId: string) => {
    await handleStatusUpdate(applicationId, 'approved', 'Candidature approuvée - Profil activé');
  };

  const handleReject = async (applicationId: string) => {
    await handleStatusUpdate(applicationId, 'rejected', adminComments || 'Candidature refusée');
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.documents_required}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entretiens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.interview_scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Surveillance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.under_review}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Candidatures prestataires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">Nouvelles candidatures</SelectItem>
                <SelectItem value="documents_required">En attente documents</SelectItem>
                <SelectItem value="interview_scheduled">En entretien/test</SelectItem>
                <SelectItem value="approved">Validés</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="under_review">Sous surveillance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Aide à domicile">Aide à domicile</SelectItem>
                <SelectItem value="Garde d'enfants">Garde d'enfants</SelectItem>
                <SelectItem value="Ménage">Ménage</SelectItem>
                <SelectItem value="Jardinage">Jardinage</SelectItem>
                <SelectItem value="Bricolage">Bricolage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table des candidatures */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{application.first_name} {application.last_name}</div>
                      <div className="text-sm text-muted-foreground">{application.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{application.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {application.experience_years ? `${application.experience_years} ans` : 'Non spécifié'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(application.status)}
                      {getStatusLabel(application.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(application.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        
                        {/* Actions rapides selon le statut */}
                        {application.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleScheduleInterview(application.id)}
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Entretien
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestDocuments(application.id)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Documents
                            </Button>
                          </>
                        )}
                        
                        {application.status === 'interview_scheduled' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(application.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Valider
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(application.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </>
                        )}

                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Détails de la candidature</DialogTitle>
                          </DialogHeader>
                          {selectedApplication && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Informations personnelles</h4>
                                  <div className="space-y-2">
                                    <p><strong>Nom:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</p>
                                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                                    <p><strong>Téléphone:</strong> {selectedApplication.phone}</p>
                                    <p><strong>Transport:</strong> {selectedApplication.has_transport ? 'Oui' : 'Non'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">Expérience professionnelle</h4>
                                  <div className="space-y-2">
                                    <p><strong>Catégorie:</strong> {selectedApplication.category}</p>
                                    <p><strong>Expérience:</strong> {selectedApplication.experience_years || 'Non spécifié'} ans</p>
                                    <p><strong>Disponibilité:</strong> {selectedApplication.availability}</p>
                                    {selectedApplication.certifications && (
                                      <p><strong>Certifications:</strong> {selectedApplication.certifications}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-3">Motivation</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">
                                  {selectedApplication.motivation}
                                </p>
                              </div>

                              {selectedApplication.cv_file_url && (
                                <div>
                                  <h4 className="font-semibold mb-3">CV</h4>
                                  <Button variant="outline" asChild>
                                    <a href={selectedApplication.cv_file_url} target="_blank" rel="noopener noreferrer">
                                      <FileText className="w-4 h-4 mr-2" />
                                      Voir le CV
                                    </a>
                                  </Button>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold mb-3">Actions administrateur</h4>
                                <div className="flex gap-4">
                                  <Select
                                    value={selectedApplication.status}
                                    onValueChange={(value) => handleStatusUpdate(selectedApplication.id, value)}
                                  >
                                    <SelectTrigger className="w-[250px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Nouvelle candidature</SelectItem>
                                      <SelectItem value="documents_required">En attente documents</SelectItem>
                                      <SelectItem value="interview_scheduled">En entretien/test</SelectItem>
                                      <SelectItem value="approved">Validé</SelectItem>
                                      <SelectItem value="rejected">Refusé</SelectItem>
                                      <SelectItem value="active">Actif</SelectItem>
                                      <SelectItem value="under_review">Sous surveillance</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="mt-4">
                                  <label className="text-sm font-medium">Commentaires administrateur</label>
                                  <Textarea
                                    value={adminComments || selectedApplication.admin_comments || ''}
                                    onChange={(e) => setAdminComments(e.target.value)}
                                    placeholder="Ajouter un commentaire..."
                                    className="mt-2"
                                  />
                                  <Button 
                                    className="mt-2"
                                    onClick={() => handleStatusUpdate(selectedApplication.id, selectedApplication.status, adminComments)}
                                  >
                                    Sauvegarder commentaire
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};