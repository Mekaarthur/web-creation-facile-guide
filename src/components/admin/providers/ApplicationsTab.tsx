import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, CheckCircle, XCircle, Mail, Phone, UserCheck } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ApplicationDocumentsValidator } from '../ApplicationDocumentsValidator';
import { Application } from './types';

interface Props {
  applications: Application[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  selectedApplication: Application | null;
  setSelectedApplication: (a: Application | null) => void;
  adminComments: string;
  setAdminComments: (v: string) => void;
  getStatusBadge: (status: string, isProvider?: boolean) => JSX.Element;
  getApplicationStats: () => Record<string, number>;
  handleApplicationAction: (id: string, status: string) => Promise<void>;
  convertToProvider: (id: string) => Promise<void>;
  loadApplications: () => Promise<void>;
}

export function ApplicationsTab({
  applications, statusFilter, setStatusFilter,
  selectedApplication, setSelectedApplication,
  adminComments, setAdminComments,
  getStatusBadge, getApplicationStats,
  handleApplicationAction, convertToProvider, loadApplications,
}: Props) {
  const stats = getApplicationStats();
  const filtered = applications.filter(app => statusFilter === 'all' || app.status === statusFilter);

  return (
    <TabsContent value="applications" className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Information :</strong> Cette section affiche les <strong>candidatures</strong> reçues.
          Pour qu'une candidature devienne un prestataire actif, elle doit être validée puis convertie.
          Les prestataires convertis apparaissent dans l'onglet "Prestataires".
        </p>
      </div>
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
          <TabsTrigger value="all">Tous ({stats.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
          <TabsTrigger value="interview_scheduled">Entretien ({stats.interview_scheduled})</TabsTrigger>
          <TabsTrigger value="approved">Validés ({stats.approved})</TabsTrigger>
          <TabsTrigger value="converted">Convertis ({stats.converted})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">Aucune candidature trouvée</p></CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{application.first_name} {application.last_name}</h3>
                          {getStatusBadge(application.status, false)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2"><Mail className="w-4 h-4" />{application.email}</p>
                          <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{application.phone}</p>
                          <p>Catégorie: {application.category}</p>
                          <p>Candidature du {format(new Date(application.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                              <Eye className="w-4 h-4 mr-2" />Examiner
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Candidature de {application.first_name} {application.last_name}</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <div className="space-y-6">
                                <div>
                                  <h3 className="font-semibold text-lg mb-3">Informations personnelles</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-medium text-muted-foreground">Email</label><p>{selectedApplication.email}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Téléphone</label><p>{selectedApplication.phone}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Catégorie</label><p>{selectedApplication.category}</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Expérience</label><p>{selectedApplication.experience_years || 'Non renseigné'} ans</p></div>
                                    <div><label className="text-sm font-medium text-muted-foreground">Transport</label><p>{selectedApplication.has_transport ? '✅ Oui' : '❌ Non'}</p></div>
                                    {selectedApplication.certifications && (
                                      <div className="col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                                        <p className="mt-1">{selectedApplication.certifications}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <ApplicationDocumentsValidator application={selectedApplication} onDocumentUpdated={loadApplications} />

                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Disponibilité</label>
                                  <p className="mt-1 p-3 bg-muted rounded">{selectedApplication.availability}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Motivation</label>
                                  <p className="mt-1 p-3 bg-muted rounded">{selectedApplication.motivation}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Commentaires admin</label>
                                  <Textarea value={adminComments} onChange={(e) => setAdminComments(e.target.value)} placeholder="Ajouter des commentaires..." className="mt-1" />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  {selectedApplication.status === 'pending' && (
                                    <>
                                      <Button variant="outline" size="sm" onClick={() => handleApplicationAction(selectedApplication.id, 'interview_scheduled')}>Programmer entretien</Button>
                                      <Button variant="default" size="sm" onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}>
                                        <CheckCircle className="w-4 h-4 mr-2" />Valider
                                      </Button>
                                    </>
                                  )}
                                  {(selectedApplication.status === 'approved' || selectedApplication.status === 'interview_scheduled') && (
                                    <Button variant="secondary" size="sm" onClick={() => convertToProvider(selectedApplication.id)}>
                                      <UserCheck className="w-4 h-4 mr-2" />Convertir en prestataire
                                    </Button>
                                  )}
                                  {selectedApplication.status !== 'rejected' && (
                                    <Button variant="destructive" size="sm" onClick={() => handleApplicationAction(selectedApplication.id, 'rejected')}>
                                      <XCircle className="w-4 h-4 mr-2" />Rejeter
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {application.status === 'pending' && (
                          <Button variant="default" size="sm" onClick={() => handleApplicationAction(application.id, 'approved')}>Valider</Button>
                        )}
                        {(application.status === 'approved' || application.status === 'interview_scheduled') && (
                          <Button variant="secondary" size="sm" onClick={() => convertToProvider(application.id)}>
                            <UserCheck className="w-4 h-4 mr-1" />Convertir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
}
