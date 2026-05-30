import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import {
  Search, RefreshCw, Eye, MessageSquare, MapPin, Phone, Mail,
  Calendar, Clock, Euro, AlertTriangle, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service_description: string;
  location: string;
  pickup_address: string | null;
  delivery_address: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  budget_range: string | null;
  urgency_level: string | null;
  additional_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  new:         { label: 'Nouveau',     variant: 'destructive', color: 'text-red-600' },
  in_progress: { label: 'En cours',   variant: 'default',     color: 'text-blue-600' },
  completed:   { label: 'Traité',     variant: 'secondary',   color: 'text-green-600' },
  cancelled:   { label: 'Annulé',     variant: 'outline',     color: 'text-gray-500' },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low:       { label: 'Pas pressé',  color: 'text-gray-500' },
  normal:    { label: 'Normal',      color: 'text-blue-500' },
  high:      { label: 'Urgent',      color: 'text-orange-500' },
  very_high: { label: 'Très urgent', color: 'text-red-600' },
};

export const AdminCustomRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests]           = useState<CustomRequest[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState<CustomRequest | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [updating, setUpdating]           = useState(false);
  const [adminNote, setAdminNote]         = useState('');
  const [newStatus, setNewStatus]         = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      if (searchTerm.trim()) {
        query = query.or(
          `client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,service_description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      toast({ title: 'Erreur de chargement', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('custom_requests')
        .update({
          status: newStatus,
          additional_notes: adminNote
            ? `${selected.additional_notes ? selected.additional_notes + '\n\n' : ''}[Admin] ${adminNote}`
            : selected.additional_notes,
        })
        .eq('id', selected.id);

      if (error) throw error;

      supabase.functions.invoke('send-modern-notification', {
        body: {
          type: 'custom_request_status_update',
          recipient: {
            email: selected.client_email,
            name: selected.client_name,
            firstName: selected.client_name.split(' ')[0],
          },
          data: {
            clientName: selected.client_name,
            newStatus: newStatus,
            serviceDescription: selected.service_description,
            adminNote: adminNote || undefined,
            bookingId: selected.id,
          },
        },
      }).catch(() => {});

      toast({ title: 'Demande mise à jour' });
      setSelected(null);
      setAdminNote('');
      setNewStatus('');
      fetchRequests();
    } catch (err) {
      toast({ title: 'Erreur de mise à jour', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const openDetail = (req: CustomRequest) => {
    setSelected(req);
    setNewStatus(req.status);
    setAdminNote('');
  };

  // Stats rapides
  const counts = {
    all:         requests.length,
    new:         requests.filter(r => r.status === 'new').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed:   requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Demandes personnalisées
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Demandes soumises via le formulaire client
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: counts.all,         icon: MessageSquare, color: 'text-primary' },
          { label: 'Nouveaux',  value: counts.new,         icon: AlertTriangle, color: 'text-red-500' },
          { label: 'En cours',  value: counts.in_progress, icon: Clock,         color: 'text-blue-500' },
          { label: 'Traités',   value: counts.completed,   icon: CheckCircle,   color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, description, adresse…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous ({counts.all})</SelectItem>
            <SelectItem value="new">Nouveau ({counts.new})</SelectItem>
            <SelectItem value="in_progress">En cours ({counts.in_progress})</SelectItem>
            <SelectItem value="completed">Traité ({counts.completed})</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map(req => {
                const statusCfg  = STATUS_CONFIG[req.status]   || STATUS_CONFIG.new;
                const urgencyCfg = URGENCY_CONFIG[req.urgency_level || 'normal'] || URGENCY_CONFIG.normal;
                return (
                  <div
                    key={req.id}
                    className="p-4 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => openDetail(req)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Infos client */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{req.client_name}</span>
                          <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                          {req.urgency_level && req.urgency_level !== 'normal' && (
                            <span className={`text-xs font-medium ${urgencyCfg.color}`}>
                              ⚡ {urgencyCfg.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {req.service_description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />{req.client_email}
                          </span>
                          {req.client_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{req.client_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{req.location}
                          </span>
                        </div>
                      </div>
                      {/* Méta */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(req.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                        {req.budget_range && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Euro className="w-3 h-3" />{req.budget_range}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />Voir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setAdminNote(''); setNewStatus(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Demande de {selected.client_name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
                    <p className="font-semibold">{selected.client_name}</p>
                    <a href={`mailto:${selected.client_email}`} className="text-sm text-primary flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" />{selected.client_email}
                    </a>
                    {selected.client_phone && (
                      <a href={`tel:${selected.client_phone}`} className="text-sm flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3" />{selected.client_phone}
                      </a>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Infos</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_CONFIG[selected.status]?.variant || 'default'}>
                        {STATUS_CONFIG[selected.status]?.label || selected.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reçu le {format(new Date(selected.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {selected.budget_range && (
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Euro className="w-3 h-3" />Budget : {selected.budget_range}
                      </p>
                    )}
                    {selected.urgency_level && selected.urgency_level !== 'normal' && (
                      <p className={`text-sm font-medium ${URGENCY_CONFIG[selected.urgency_level]?.color || ''}`}>
                        ⚡ {URGENCY_CONFIG[selected.urgency_level]?.label}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description du service</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-md p-3">{selected.service_description}</p>
                </div>

                {/* Adresses */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresses</p>
                  <div className="text-sm space-y-1">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Lieu :</strong> {selected.location}</span>
                    </p>
                    {selected.pickup_address && (
                      <p className="flex items-start gap-1.5 ml-5 text-muted-foreground">
                        Départ : {selected.pickup_address}
                      </p>
                    )}
                    {selected.delivery_address && (
                      <p className="flex items-start gap-1.5 ml-5 text-muted-foreground">
                        Livraison : {selected.delivery_address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date/heure souhaitées */}
                {(selected.preferred_date || selected.preferred_time) && (
                  <div className="flex items-center gap-4 text-sm">
                    {selected.preferred_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(new Date(selected.preferred_date), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    )}
                    {selected.preferred_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {selected.preferred_time}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selected.additional_notes && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-md p-3">{selected.additional_notes}</p>
                  </div>
                )}

                <Separator />

                {/* Actions admin */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions admin</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Changer le statut</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nouveau</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Traité</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Note admin (optionnel)</label>
                      <Textarea
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder="Ajoutez une note interne…"
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => { setSelected(null); setAdminNote(''); setNewStatus(''); }}
                    >
                      Fermer
                    </Button>
                    <Button
                      onClick={updateStatus}
                      disabled={updating || newStatus === selected.status && !adminNote}
                    >
                      {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomRequests;
