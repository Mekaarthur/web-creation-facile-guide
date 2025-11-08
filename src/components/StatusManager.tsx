import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Send,
  Eye,
  AlertTriangle,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface StatusManagerProps {
  itemId: string;
  currentStatus: string;
  itemType: 'job_application' | 'client_request';
  onStatusUpdate: (newStatus: string) => void;
  itemData?: any;
}

const StatusManager: React.FC<StatusManagerProps> = ({
  itemId,
  currentStatus,
  itemType,
  onStatusUpdate,
  itemData
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [comments, setComments] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Définir les workflows selon le type d'élément
  const getAvailableStatuses = () => {
    if (itemType === 'job_application') {
      return {
        'pending': {
          label: 'En attente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          nextStates: ['under_review', 'rejected']
        },
        'under_review': {
          label: 'En cours d\'examen',
          color: 'bg-blue-100 text-blue-800',
          icon: Eye,
          nextStates: ['interview_scheduled', 'approved', 'rejected']
        },
        'interview_scheduled': {
          label: 'Entretien programmé',
          color: 'bg-purple-100 text-purple-800',
          icon: UserCheck,
          nextStates: ['approved', 'rejected']
        },
        'approved': {
          label: 'Approuvée',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          nextStates: ['onboarding']
        },
        'rejected': {
          label: 'Rejetée',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          nextStates: []
        },
        'onboarding': {
          label: 'En formation',
          color: 'bg-indigo-100 text-indigo-800',
          icon: Send,
          nextStates: ['active']
        },
        'active': {
          label: 'Actif',
          color: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle,
          nextStates: []
        }
      };
    } else {
      return {
        'new': {
          label: 'Nouvelle',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          nextStates: ['processing', 'rejected']
        },
        'processing': {
          label: 'En traitement',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Eye,
          nextStates: ['assigned', 'on_hold', 'rejected']
        },
        'assigned': {
          label: 'Assignée',
          color: 'bg-purple-100 text-purple-800',
          icon: UserCheck,
          nextStates: ['converted', 'cancelled']
        },
        'on_hold': {
          label: 'En attente',
          color: 'bg-orange-100 text-orange-800',
          icon: AlertTriangle,
          nextStates: ['processing', 'rejected']
        },
        'converted': {
          label: 'Convertie',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          nextStates: []
        },
        'rejected': {
          label: 'Rejetée',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          nextStates: []
        },
        'cancelled': {
          label: 'Annulée',
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle,
          nextStates: []
        }
      };
    }
  };

  const statuses = getAvailableStatuses();
  const currentStatusConfig = statuses[currentStatus] || statuses['pending'];
  const availableNextStates = currentStatusConfig.nextStates || [];

  const updateStatus = async () => {
    if (selectedStatus === currentStatus) {
      setIsDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      const tableName = itemType === 'job_application' ? 'job_applications' : 'client_requests';
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: selectedStatus,
          ...(comments && { admin_comments: comments })
        })
        .eq('id', itemId);

      if (error) throw error;

      // Envoyer notification email si nécessaire
      if (itemType === 'job_application' && itemData?.email) {
        try {
          await supabase.functions.invoke('send-job-status-notification', {
            body: {
              email: itemData.email,
              firstName: itemData.first_name,
              lastName: itemData.last_name,
              oldStatus: currentStatus,
              newStatus: selectedStatus,
              comments
            }
          });
        } catch (emailError) {
          console.error('Error sending status notification:', emailError);
        }
      }

      onStatusUpdate(selectedStatus);
      setIsDialogOpen(false);
      setComments('');

      toast({
        title: "Statut mis à jour",
        description: `${itemType === 'job_application' ? 'Candidature' : 'Demande'} mise à jour vers "${statuses[selectedStatus]?.label}"`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut"
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Badge statut actuel */}
      <Badge className={currentStatusConfig.color}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {currentStatusConfig.label}
      </Badge>

      {/* Actions rapides */}
      {availableNextStates.length > 0 && (
        <div className="flex gap-1">
          {availableNextStates.slice(0, 2).map((status) => {
            const statusConfig = statuses[status];
            const StatusIcon = statusConfig.icon;
            
            return (
              <AlertDialog key={status}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    title={`Passer à: ${statusConfig.label}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
                    <AlertDialogDescription>
                      {status === 'approved' && itemType === 'job_application' ? (
                        <div className="space-y-2">
                          <p>Êtes-vous sûr de vouloir <strong>approuver</strong> cette candidature ?</p>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                            <p className="text-sm text-green-800 font-medium">✅ Actions automatiques :</p>
                            <ul className="text-sm text-green-700 mt-1 space-y-1 list-disc list-inside">
                              <li>Création automatique du compte prestataire</li>
                              <li>Attribution du rôle "Provider"</li>
                              <li>Envoi d'email de confirmation au candidat</li>
                              <li>Traçabilité complète dans l'historique admin</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p>Êtes-vous sûr de vouloir passer ce{itemType === 'job_application' ? 'tte candidature' : 'tte demande'} au statut "{statusConfig.label}" ?</p>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setSelectedStatus(status);
                        setTimeout(updateStatus, 100);
                      }}
                      className={status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {status === 'approved' ? 'Approuver et créer le prestataire' : 'Confirmer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })}
        </div>
      )}

      {/* Dialogue complet */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Gérer le statut {itemType === 'job_application' ? 'de la candidature' : 'de la demande'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status-select">Nouveau statut</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentStatus} disabled>
                    {currentStatusConfig.label} (actuel)
                  </SelectItem>
                  {availableNextStates.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statuses[status]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comments">Commentaires (optionnel)</Label>
              <Textarea
                id="comments"
                placeholder="Ajouter un commentaire sur ce changement de statut..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={updateStatus}
                disabled={loading || selectedStatus === currentStatus}
              >
                {loading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusManager;