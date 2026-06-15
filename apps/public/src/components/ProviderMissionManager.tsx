import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MessageCircle,
  CheckCircle,
  Play,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Camera,
  Navigation,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStatusColor, getStatusLabel, formatCurrency } from '@/utils/statusUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  provider_payment: number | null;         // R-PROV-01: never total_price
  financial_transaction_id?: string | null;
  client_notes?: string;
  provider_notes?: string;
  services?: { name: string; category: string } | null;
  profiles?: { first_name: string; last_name: string; avatar_url?: string; phone?: string } | null;
}

interface ProviderMissionManagerProps {
  missions: Mission[];
  onUpdateStatus: (missionId: string, status: string, notes?: string) => void;
  loading?: boolean;
}

type TabKey = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming',  label: 'À venir' },
  { key: 'ongoing',   label: 'En cours' },
  { key: 'past',      label: 'Passées' },
  { key: 'cancelled', label: 'Annulées' },
];

function getTabMissions(missions: Mission[], tab: TabKey, today: string): Mission[] {
  switch (tab) {
    case 'upcoming':
      return missions.filter(m =>
        m.booking_date >= today &&
        ['confirmed', 'pending_provider'].includes(m.status)
      );
    case 'ongoing':
      return missions.filter(m => m.status === 'in_progress');
    case 'past':
      return missions.filter(m =>
        m.booking_date < today &&
        ['completed', 'cancelled'].includes(m.status)
      );
    case 'cancelled':
      return missions.filter(m => m.status === 'cancelled');
  }
}

const ProviderMissionManager: React.FC<ProviderMissionManagerProps> = ({
  missions,
  onUpdateStatus,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMissionId, setPhotoMissionId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [updateNotes, setUpdateNotes] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const tabCounts = useMemo(() => ({
    upcoming:  getTabMissions(missions, 'upcoming', today).length,
    ongoing:   getTabMissions(missions, 'ongoing', today).length,
    past:      getTabMissions(missions, 'past', today).length,
    cancelled: getTabMissions(missions, 'cancelled', today).length,
  }), [missions, today]);

  const filteredMissions = useMemo(() => {
    let list = getTabMissions(missions, activeTab, today);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(m =>
        m.services?.name.toLowerCase().includes(q) ||
        m.profiles?.first_name?.toLowerCase().includes(q) ||
        m.profiles?.last_name?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const cmp = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [missions, activeTab, searchTerm, sortOrder, today]);

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'confirmed',  label: 'Confirmer', icon: CheckCircle, color: 'text-success' },
          { value: 'cancelled',  label: 'Annuler',   icon: AlertCircle, color: 'text-destructive' },
        ];
      case 'confirmed':
        return [{ value: 'in_progress', label: 'Commencer', icon: Play, color: 'text-info' }];
      case 'in_progress':
        return [{ value: 'completed', label: 'Terminer', icon: CheckCircle, color: 'text-success' }];
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoMissionId) return;
    setUploadingPhoto(true);
    try {
      const path = `missions/${photoMissionId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('provider-documents').upload(path, file);
      if (error) throw error;
      toast({ title: 'Photo ajoutée', description: 'Votre photo a bien été enregistrée.' });
    } catch (err: any) {
      toast({ title: 'Erreur upload', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      setPhotoMissionId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Hidden file input for photos — R-PROV-07 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <div className="space-y-6">
        {/* Search + sort */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par service, client, adresse..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="self-start"
              >
                Date {sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4 semantic tabs — A2 fix */}
        <div className="flex gap-1 border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <Badge variant={activeTab === tab.key ? 'default' : 'secondary'} className="ml-1.5 text-[10px] px-1.5 py-0">
                  {tabCounts[tab.key]}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Missions list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune mission</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'Essayez de modifier votre recherche.' : `Aucune mission dans l'onglet « ${TABS.find(t => t.key === activeTab)?.label} ».`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMissions.map(mission => {
              const isExpanded = expandedMission === mission.id;
              const nextActions = getNextStatusOptions(mission.status);
              const canCall = ['confirmed', 'in_progress'].includes(mission.status) && !!mission.profiles?.phone;

              return (
                <Card key={mission.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{mission.services?.name || 'Service non spécifié'}</h3>
                            <Badge className={getStatusColor(mission.status)} variant="secondary">
                              {getStatusLabel(mission.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              {format(new Date(mission.booking_date), 'PPPP', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              {mission.start_time} - {mission.end_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 flex-shrink-0" />
                              {mission.profiles?.first_name} {mission.profiles?.last_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              {mission.address || 'Adresse à confirmer'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {/* R-PROV-01: show provider_payment, never total_price */}
                          <div className="text-xl font-bold text-primary mb-1">
                            {mission.provider_payment != null
                              ? `${formatCurrency(mission.provider_payment)}`
                              : '—'}
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1">Votre rémunération</p>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedMission(isExpanded ? null : mission.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {nextActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {nextActions.map(action => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.value}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(mission, action.value)}
                                className={`${action.color} border-current`}
                              >
                                <Icon className="w-4 h-4 mr-2" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-6 space-y-4">
                        {mission.client_notes && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <MessageCircle className="w-4 h-4" />Notes du client
                            </h4>
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">{mission.client_notes}</p>
                          </div>
                        )}
                        {mission.provider_notes && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />Vos notes
                            </h4>
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">{mission.provider_notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {/* R-PROV-04: phone only for confirmed/in_progress */}
                          {canCall && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { window.location.href = `tel:${mission.profiles!.phone}`; }}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Appeler le client
                            </Button>
                          )}

                          {/* R-PROV-05: internal messaging — TODO #v2 dedicated /messages route */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/espace-prestataire')}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Envoyer un message
                          </Button>

                          {/* R-PROV-06: native maps */}
                          {mission.address && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(mission.address)}`, '_blank')}
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Itinéraire
                            </Button>
                          )}

                          {/* R-PROV-07: photos → provider-documents bucket */}
                          {mission.status === 'in_progress' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploadingPhoto}
                              onClick={() => {
                                setPhotoMissionId(mission.id);
                                fileInputRef.current?.click();
                              }}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              {uploadingPhoto && photoMissionId === mission.id ? 'Envoi...' : 'Ajouter des photos'}
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
            <DialogTitle>Mettre à jour le statut de la mission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mission : {selectedMission?.services?.name}</p>
              <p className="text-sm text-muted-foreground">Client : {selectedMission?.profiles?.first_name} {selectedMission?.profiles?.last_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nouveau statut : <span className="font-bold">{getStatusLabel(newStatus)}</span>
              </label>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (optionnel)</label>
              <Textarea
                placeholder="Ajoutez des notes sur cette mise à jour..."
                value={updateNotes}
                onChange={e => setUpdateNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button onClick={confirmStatusUpdate}>Confirmer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProviderMissionManager;
