import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Phone, 
  MessageCircle,
  CheckCircle,
  Play,
  Square,
  AlertCircle,
  Star,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Camera,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  total_price: number;
  client_notes?: string;
  provider_notes?: string;
  services?: { name: string; category: string } | null;
  profiles?: { first_name: string; last_name: string; avatar_url?: string } | null;
}

interface ProviderMissionManagerProps {
  missions: Mission[];
  onUpdateStatus: (missionId: string, status: string, notes?: string) => void;
  loading?: boolean;
}

const ProviderMissionManager: React.FC<ProviderMissionManagerProps> = ({
  missions,
  onUpdateStatus,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [updateNotes, setUpdateNotes] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Filter and sort missions
  const filteredAndSortedMissions = useMemo(() => {
    let filtered = missions.filter(mission => {
      const matchesSearch = searchTerm === '' || 
        mission.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort missions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
          break;
        case 'price':
          comparison = a.total_price - b.total_price;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [missions, searchTerm, statusFilter, sortBy, sortOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'confirmed', label: 'Confirmer', icon: CheckCircle, color: 'text-green-600' },
          { value: 'cancelled', label: 'Annuler', icon: AlertCircle, color: 'text-red-600' }
        ];
      case 'confirmed':
        return [
          { value: 'in_progress', label: 'Commencer', icon: Play, color: 'text-blue-600' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Terminer', icon: CheckCircle, color: 'text-green-600' }
        ];
      default:
        return [];
    }
  };

  const handleStatusUpdate = (mission: Mission, status: string) => {
    setSelectedMission(mission);
    setNewStatus(status);
    setUpdateNotes('');
    setShowStatusDialog(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedMission && newStatus) {
      onUpdateStatus(selectedMission.id, newStatus, updateNotes);
      setShowStatusDialog(false);
      setSelectedMission(null);
      setNewStatus('');
      setUpdateNotes('');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par service, client, adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm min-w-[140px]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm min-w-[120px]"
                >
                  <option value="date">Par date</option>
                  <option value="price">Par prix</option>
                  <option value="status">Par statut</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['pending', 'confirmed', 'in_progress', 'completed'].map(status => {
            const count = missions.filter(m => m.status === status).length;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${getStatusColor(status).split(' ')[1]}`}>
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getStatusLabel(status)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Missions List */}
        <div className="space-y-4">
          {filteredAndSortedMissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune mission trouvée</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Essayez de modifier vos critères de recherche"
                    : "Vous n'avez pas encore de missions assignées"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedMissions.map((mission) => {
              const isExpanded = expandedMission === mission.id;
              const nextActions = getNextStatusOptions(mission.status);
              
              return (
                <Card key={mission.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-0">
                    {/* Main Mission Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{mission.services?.name || 'Service non spécifié'}</h3>
                            <Badge className={getStatusColor(mission.status)} variant="secondary">
                              {getStatusLabel(mission.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(mission.booking_date), 'PPPP', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {mission.start_time} - {mission.end_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {mission.profiles?.first_name} {mission.profiles?.last_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {mission.address || 'Adresse à confirmer'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-2">
                            {formatCurrency(mission.total_price)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedMission(isExpanded ? null : mission.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {nextActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {nextActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.value}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(mission, action.value)}
                                className={`${action.color} border-current hover:bg-current hover:text-white`}
                              >
                                <Icon className="w-4 h-4 mr-2" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-6 space-y-4">
                        {mission.client_notes && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <MessageCircle className="w-4 h-4" />
                              Notes du client
                            </h4>
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
                              {mission.client_notes}
                            </p>
                          </div>
                        )}
                        
                        {mission.provider_notes && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Vos notes
                            </h4>
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
                              {mission.provider_notes}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Appeler le client
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Envoyer un message
                          </Button>
                          <Button variant="outline" size="sm">
                            <Navigation className="w-4 h-4 mr-2" />
                            Itinéraire
                          </Button>
                          {mission.status === 'in_progress' && (
                            <Button variant="outline" size="sm">
                              <Camera className="w-4 h-4 mr-2" />
                              Ajouter des photos
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mettre à jour le statut de la mission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Mission: {selectedMission?.services?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Client: {selectedMission?.profiles?.first_name} {selectedMission?.profiles?.last_name}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nouveau statut: <span className="font-bold">{getStatusLabel(newStatus)}</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (optionnel)
              </label>
              <Textarea
                placeholder="Ajoutez des notes sur cette mise à jour..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Annuler
              </Button>
              <Button onClick={confirmStatusUpdate}>
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProviderMissionManager;