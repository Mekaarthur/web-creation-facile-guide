import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Calendar, Clock, MapPin, Euro, FileText, Star, Award,
  AlertTriangle, ChevronLeft, ChevronRight, Search, Loader2, Heart,
  RotateCcw, Scale, RefreshCw,
} from 'lucide-react';
import { format, subDays, subMonths, subYears, isAfter, parseISO, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookingCancellation } from '@/components/BookingCancellation';

type StatusGroup = 'upcoming' | 'in_progress' | 'past' | 'cancelled';
type PeriodFilter = 'all' | '7d' | '30d' | '6m' | '1y';
type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  address: string | null;
  service_id: string;
  provider_id: string;
  completed_at: string | null;
  cancelled_at: string | null;
  services?: { name: string; category: string } | null;
  providers?: { business_name: string | null; user_id: string } | null;
  invoices?: { id: string; invoice_number: string; status: string }[];
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'outline' },
  confirmed: { label: 'Confirmée', variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminée', variant: 'secondary' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

export const ClientPrestationsHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusGroup>('upcoming');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [page, setPage] = useState(1);
  // Signalement anomalie (passées)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBooking, setReportBooking] = useState<Booking | null>(null);
  const [reportText, setReportText] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Litige structuré
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [disputeType, setDisputeType] = useState('qualite');
  const [disputeResolution, setDisputeResolution] = useState('remboursement');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeAmount, setDisputeAmount] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Report de RDV
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const [favoritedProviders, setFavoritedProviders] = useState<Set<string>>(new Set());
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('client_favorites')
      .select('provider_id')
      .eq('client_id', user.id)
      .in('status', ['pending_provider', 'active']);
    if (data) setFavoritedProviders(new Set(data.map((f: any) => f.provider_id)));
  };

  const handleAddFavorite = async (booking: Booking) => {
    if (!user || !booking.provider_id) return;
    setAddingFavorite(booking.provider_id);
    try {
      const { error } = await supabase.functions.invoke('manage-favorites', {
        body: { action: 'request', providerId: booking.provider_id, bookingId: booking.id },
      });
      if (error) throw error;
      setFavoritedProviders(prev => new Set([...prev, booking.provider_id]));
      toast({ title: 'Demande envoyée', description: 'Le prestataire va recevoir votre demande de binôme.' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Impossible d\'envoyer la demande', variant: 'destructive' });
    } finally {
      setAddingFavorite(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [tab, period, sortBy]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_time, end_time, status, total_price, address,
          service_id, provider_id, completed_at, cancelled_at,
          services:service_id ( name, category ),
          providers:provider_id ( business_name, user_id ),
          invoices ( id, invoice_number, status )
        `)
        .eq('client_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setBookings((data || []) as any);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger l\'historique', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const groupOf = (b: Booking): StatusGroup => {
    if (b.status === 'cancelled') return 'cancelled';
    if (b.status === 'in_progress') return 'in_progress';
    if (b.status === 'completed') return 'past';
    // pending / confirmed → à venir si date future, sinon passées
    const bookingDate = parseISO(b.booking_date);
    return isAfter(bookingDate, new Date()) ? 'upcoming' : 'past';
  };

  const periodCutoff = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '6m': return subMonths(now, 6);
      case '1y': return subYears(now, 1);
      default: return null;
    }
  }, [period]);

  const filtered = useMemo(() => {
    let list = bookings.filter(b => groupOf(b) === tab);
    if (periodCutoff) {
      list = list.filter(b => isAfter(parseISO(b.booking_date), periodCutoff));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc': return a.booking_date.localeCompare(b.booking_date);
        case 'date_desc': return b.booking_date.localeCompare(a.booking_date);
        case 'amount_asc': return a.total_price - b.total_price;
        case 'amount_desc': return b.total_price - a.total_price;
      }
    });
    return list;
  }, [bookings, tab, periodCutoff, sortBy]);

  const counts = useMemo(() => {
    const c = { upcoming: 0, in_progress: 0, past: 0, cancelled: 0 } as Record<StatusGroup, number>;
    bookings.forEach(b => { c[groupOf(b)]++; });
    return c;
  }, [bookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId },
      });
      if (error) throw error;
      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      } else {
        toast({ title: 'Facture', description: 'Téléchargement en cours...' });
      }
    } catch (e) {
      toast({ title: 'Erreur', description: 'Téléchargement de la facture indisponible', variant: 'destructive' });
    }
  };

  const openReport = (b: Booking) => {
    setReportBooking(b);
    setReportText('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!reportBooking || !user || reportText.trim().length < 10) {
      toast({ title: 'Description trop courte', description: 'Merci de décrire l\'anomalie (10 caractères min).', variant: 'destructive' });
      return;
    }
    setSubmittingReport(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        client_id: user.id,
        booking_id: reportBooking.id,
        provider_id: reportBooking.provider_id,
        complaint_type: 'historique_anomalie',
        title: `Anomalie historique - ${reportBooking.services?.name || 'Prestation'}`,
        description: reportText.trim(),
        priority: 'medium',
        status: 'open',
      });
      if (error) throw error;

      supabase.functions.invoke('send-anomaly-report', {
        body: { bookingId: reportBooking.id, clientEmail: user.email, description: reportText.trim(), serviceName: reportBooking.services?.name, bookingDate: reportBooking.booking_date },
      }).catch(() => {});

      toast({ title: 'Signalement envoyé', description: 'Notre support vous répondra sous 48h ouvrées.' });
      setReportOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le signalement', variant: 'destructive' });
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Litige structuré ────────────────────────────────────────────────
  const openDispute = (b: Booking) => {
    setDisputeBooking(b);
    setDisputeType('qualite');
    setDisputeResolution('remboursement');
    setDisputeDesc('');
    setDisputeAmount('');
    setDisputeOpen(true);
  };

  const DISPUTE_PRIORITY: Record<string, string> = {
    paiement: 'high',
    no_show:  'high',
    qualite:  'medium',
    retard:   'medium',
    autre:    'low',
  };

  const submitDispute = async () => {
    if (!disputeBooking || !user || disputeDesc.trim().length < 20) {
      toast({ title: 'Description insuffisante', description: 'Décrivez votre litige en au moins 20 caractères.', variant: 'destructive' });
      return;
    }
    setSubmittingDispute(true);
    try {
      const priority = DISPUTE_PRIORITY[disputeType] || 'medium';
      const amountNum = disputeAmount ? parseFloat(disputeAmount) : null;

      const { error } = await supabase.from('complaints').insert({
        client_id:        user.id,
        booking_id:       disputeBooking.id,
        provider_id:      disputeBooking.provider_id,
        complaint_type:   `litige_${disputeType}`,
        title:            `Litige ${disputeType} - ${disputeBooking.services?.name || 'Prestation'}`,
        description:      `[Résolution souhaitée : ${disputeResolution}${amountNum ? ` (${amountNum}€)` : ''}]\n\n${disputeDesc.trim()}`,
        priority,
        status:           'open',
      });
      if (error) throw error;

      supabase.functions.invoke('send-modern-notification', {
        body: { type: 'dispute_opened', bookingId: disputeBooking.id, clientEmail: user.email, disputeType, resolution: disputeResolution },
      }).catch(() => {});

      toast({ title: 'Litige ouvert', description: 'Notre équipe traitera votre demande sous 72h ouvrées.' });
      setDisputeOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le litige', variant: 'destructive' });
    } finally {
      setSubmittingDispute(false);
    }
  };

  // ── Demande de report ────────────────────────────────────────────────
  const openReschedule = (b: Booking) => {
    setRescheduleBooking(b);
    setNewDate('');
    setRescheduleNotes('');
    setRescheduleOpen(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleBooking || !user || !newDate) {
      toast({ title: 'Date manquante', description: 'Sélectionnez une nouvelle date.', variant: 'destructive' });
      return;
    }
    setSubmittingReschedule(true);
    try {
      const { error } = await supabase.from('complaints').insert({
        client_id:      user.id,
        booking_id:     rescheduleBooking.id,
        provider_id:    rescheduleBooking.provider_id,
        complaint_type: 'demande_report',
        title:          `Demande de report - ${rescheduleBooking.services?.name || 'Prestation'}`,
        description:    `Nouvelle date souhaitée : ${newDate}${rescheduleNotes ? `\n\nNotes : ${rescheduleNotes}` : ''}`,
        priority:       'medium',
        status:         'open',
      });
      if (error) throw error;

      toast({ title: 'Demande de report envoyée', description: 'Le support vous contactera pour confirmer le nouveau créneau.' });
      setRescheduleOpen(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer la demande', variant: 'destructive' });
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Vérifier si annulation encore possible selon politique (>2h avant)
  const canCancel = (b: Booking): boolean => {
    const bookingDt = new Date(`${b.booking_date}T${b.start_time}`);
    return differenceInHours(bookingDt, new Date()) > 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement de l'historique...
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Aucune prestation pour l'instant</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas encore de prestation. Réservez votre premier service !
            </p>
          </div>
          <Button onClick={() => navigate('/services')} className="gap-2">
            <Search className="w-4 h-4" /> Découvrir nos services
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5 text-primary" />
            Mes prestations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Période</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="6m">6 derniers mois</SelectItem>
                  <SelectItem value="1y">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Trier par</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Date (plus récent)</SelectItem>
                  <SelectItem value="date_asc">Date (plus ancien)</SelectItem>
                  <SelectItem value="amount_desc">Montant (décroissant)</SelectItem>
                  <SelectItem value="amount_asc">Montant (croissant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as StatusGroup)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="upcoming" className="gap-1.5">
                À venir <Badge variant="secondary" className="ml-1">{counts.upcoming}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-1.5">
                En cours <Badge variant="secondary" className="ml-1">{counts.in_progress}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-1.5">
                Passées <Badge variant="secondary" className="ml-1">{counts.past}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-1.5">
                Annulées <Badge variant="secondary" className="ml-1">{counts.cancelled}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4 space-y-3">
              {pageItems.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Aucune prestation dans cette catégorie pour la période sélectionnée.
                  </CardContent>
                </Card>
              ) : (
                pageItems.map((b) => {
                  const status = STATUS_LABELS[b.status] || { label: b.status, variant: 'outline' as const };
                  const isPast = tab === 'past';
                  const invoice = b.invoices?.[0];
                  return (
                    <Card key={b.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">
                                {b.services?.name || 'Service'}
                              </h4>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(parseISO(b.booking_date), 'EEEE d MMMM yyyy', { locale: fr })}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                              </div>
                              {b.providers?.business_name && (
                                <div className="flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5" />
                                  {b.providers.business_name}
                                </div>
                              )}
                              {b.address && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{b.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-end gap-2 sm:gap-1">
                            <div className="flex items-center gap-1 font-bold text-lg">
                              <Euro className="w-4 h-4" />
                              {b.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Actions pour prestations à venir */}
                        {tab === 'upcoming' && b.status !== 'cancelled' && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                            {canCancel(b) && (
                              <BookingCancellation
                                bookingId={b.id}
                                bookingDate={b.booking_date}
                                startTime={b.start_time}
                                totalPrice={b.total_price}
                                cancelledBy="client"
                                onCancelled={loadBookings}
                              />
                            )}
                            <Button size="sm" variant="outline" onClick={() => openReschedule(b)} className="gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5" /> Reporter
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openDispute(b)} className="gap-1.5 text-amber-600 hover:text-amber-700">
                              <Scale className="w-3.5 h-3.5" /> Ouvrir un litige
                            </Button>
                          </div>
                        )}

                        {/* Actions pour prestations passées */}
                        {isPast && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                            {invoice && (
                              <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(invoice.id)} className="gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Facture
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate('/espace-personnel?tab=attestations')} className="gap-1.5">
                              <Award className="w-3.5 h-3.5" /> Attestation
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigate('/espace-personnel?tab=dashboard')} className="gap-1.5">
                              <Star className="w-3.5 h-3.5" /> Mon avis
                            </Button>
                            {b.status === 'completed' && b.provider_id && (
                              favoritedProviders.has(b.provider_id) ? (
                                <Button size="sm" variant="outline" disabled className="gap-1.5 text-pink-600">
                                  <Heart className="w-3.5 h-3.5 fill-pink-500" /> Binôme demandé
                                </Button>
                              ) : (
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => handleAddFavorite(b)}
                                  disabled={addingFavorite === b.provider_id}
                                  className="gap-1.5 text-pink-600 hover:text-pink-700 hover:border-pink-400"
                                >
                                  {addingFavorite === b.provider_id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Heart className="w-3.5 h-3.5" />}
                                  Ajouter en favori
                                </Button>
                              )
                            )}
                            <Button size="sm" variant="ghost" onClick={() => openDispute(b)} className="gap-1.5 text-amber-600 hover:text-amber-700">
                              <Scale className="w-3.5 h-3.5" /> Litige
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openReport(b)} className="gap-1.5 text-destructive hover:text-destructive">
                              <AlertTriangle className="w-3.5 h-3.5" /> Anomalie
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Pagination */}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {page} / {totalPages} · {filtered.length} prestation{filtered.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal signalement anomalie */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Signaler une anomalie
            </DialogTitle>
            <DialogDescription>
              Décrivez l'anomalie constatée sur cette prestation. Notre support vous répondra sous 48h ouvrées.
            </DialogDescription>
          </DialogHeader>
          {reportBooking && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <strong>{reportBooking.services?.name}</strong> · {format(parseISO(reportBooking.booking_date), 'd MMM yyyy', { locale: fr })}
            </div>
          )}
          <Textarea
            placeholder="Expliquez l'anomalie : montant incorrect, prestation non réalisée, écart d'horaire..."
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{reportText.length}/1000</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Annuler</Button>
            <Button onClick={submitReport} disabled={submittingReport}>
              {submittingReport && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal litige structuré */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Ouvrir un litige
            </DialogTitle>
            <DialogDescription>
              Décrivez votre litige. Notre équipe de médiation traitera votre demande sous 72h ouvrées.
            </DialogDescription>
          </DialogHeader>

          {disputeBooking && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <strong>{disputeBooking.services?.name}</strong> · {format(parseISO(disputeBooking.booking_date), 'd MMM yyyy', { locale: fr })} · {disputeBooking.total_price.toFixed(2)}€
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type de litige</Label>
                <Select value={disputeType} onValueChange={setDisputeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualite">Qualité de service</SelectItem>
                    <SelectItem value="paiement">Problème de paiement</SelectItem>
                    <SelectItem value="no_show">Prestataire absent</SelectItem>
                    <SelectItem value="retard">Retard important</SelectItem>
                    <SelectItem value="securite">Problème de sécurité</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Résolution souhaitée</Label>
                <Select value={disputeResolution} onValueChange={setDisputeResolution}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remboursement">Remboursement</SelectItem>
                    <SelectItem value="avoir">Avoir / Bon de réduction</SelectItem>
                    <SelectItem value="rescheduling">Prestation refaite</SelectItem>
                    <SelectItem value="excuse">Excuse formelle</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(disputeResolution === 'remboursement' || disputeResolution === 'avoir') && (
              <div className="space-y-1.5">
                <Label>Montant demandé (€) <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  type="number"
                  placeholder={disputeBooking?.total_price.toString()}
                  value={disputeAmount}
                  onChange={e => setDisputeAmount(e.target.value)}
                  min={0}
                  max={disputeBooking?.total_price}
                  step={0.01}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Décrivez précisément les faits : date, heure, ce qui s'est passé, preuves disponibles..."
                value={disputeDesc}
                onChange={e => setDisputeDesc(e.target.value)}
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{disputeDesc.length}/2000</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Annuler</Button>
            <Button onClick={submitDispute} disabled={submittingDispute} className="bg-amber-600 hover:bg-amber-700">
              {submittingDispute && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Soumettre le litige
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal demande de report */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              Reporter le rendez-vous
            </DialogTitle>
            <DialogDescription>
              Indiquez votre nouvelle disponibilité. Le support vous confirmera le nouveau créneau sous 24h.
            </DialogDescription>
          </DialogHeader>

          {rescheduleBooking && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <strong>{rescheduleBooking.services?.name}</strong> · Actuellement : {format(parseISO(rescheduleBooking.booking_date), 'EEEE d MMM yyyy', { locale: fr })} à {rescheduleBooking.start_time?.slice(0, 5)}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nouvelle date souhaitée <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground text-xs">(horaires préférés, contraintes...)</span></Label>
              <Textarea
                placeholder="Ex : disponible en après-midi, éviter le vendredi..."
                value={rescheduleNotes}
                onChange={e => setRescheduleNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Annuler</Button>
            <Button onClick={submitReschedule} disabled={submittingReschedule || !newDate}>
              {submittingReschedule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPrestationsHistory;
