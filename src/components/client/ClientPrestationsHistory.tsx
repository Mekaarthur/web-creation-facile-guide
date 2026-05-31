import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Calendar, Clock, MapPin, Euro, FileText, Star, Award,
  AlertTriangle, ChevronLeft, ChevronRight, Search, Loader2, Heart,
  RotateCcw, Scale,
} from 'lucide-react';
import { format, subDays, subMonths, subYears, isAfter, parseISO, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookingCancellation } from '@/components/BookingCancellation';
import { AnomalyReportDialog } from './AnomalyReportDialog';
import { DisputeDialog } from './DisputeDialog';
import { RescheduleDialog } from './RescheduleDialog';

type StatusGroup = 'upcoming' | 'in_progress' | 'past' | 'cancelled';
type PeriodFilter = 'all' | '7d' | '30d' | '6m' | '1y';
type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface Booking {
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
const BOOKINGS_KEY = ['client-prestations'] as const;
const FAVORITES_KEY = (userId: string) => ['client-favorites', userId] as const;

async function fetchBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_date, start_time, end_time, status, total_price, address,
      service_id, provider_id, completed_at, cancelled_at,
      services:service_id ( name, category ),
      providers:provider_id ( business_name, user_id ),
      invoices ( id, invoice_number, status )
    `)
    .eq('client_id', userId)
    .order('booking_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as any;
}

async function fetchFavorites(userId: string): Promise<{ provider_id: string }[]> {
  const { data } = await (supabase as any)
    .from('client_favorites')
    .select('provider_id')
    .eq('client_id', userId)
    .in('status', ['pending_provider', 'active']);
  return (data as any) || [];
}

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
  const qc = useQueryClient();
  const [tab, setTab] = useState<StatusGroup>('upcoming');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [page, setPage] = useState(1);

  const [reportBooking, setReportBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: BOOKINGS_KEY,
    queryFn: () => fetchBookings(user!.id),
    enabled: !!user,
  });

  const { data: favoritesData = [] } = useQuery<{ provider_id: string }[]>({
    queryKey: FAVORITES_KEY(user?.id ?? ''),
    queryFn: () => fetchFavorites(user!.id),
    enabled: !!user,
  });

  const favoritedProviders = useMemo(
    () => new Set(favoritesData.map(f => f.provider_id)),
    [favoritesData]
  );

  const handleAddFavorite = async (booking: Booking) => {
    if (!user || !booking.provider_id) return;
    setAddingFavorite(booking.provider_id);
    try {
      const { error } = await supabase.functions.invoke('manage-favorites', {
        body: { action: 'request', providerId: booking.provider_id, bookingId: booking.id },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: FAVORITES_KEY(user.id) });
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

  const groupOf = (b: Booking): StatusGroup => {
    if (b.status === 'cancelled') return 'cancelled';
    if (b.status === 'in_progress') return 'in_progress';
    if (b.status === 'completed') return 'past';
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
    } catch {
      toast({ title: 'Erreur', description: 'Téléchargement de la facture indisponible', variant: 'destructive' });
    }
  };

  const canCancel = (b: Booking): boolean => {
    const bookingDt = new Date(`${b.booking_date}T${b.start_time}`);
    return differenceInHours(bookingDt, new Date()) > 0;
  };

  if (isLoading) {
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
                                onCancelled={() => qc.invalidateQueries({ queryKey: BOOKINGS_KEY })}
                              />
                            )}
                            <Button size="sm" variant="outline" onClick={() => setRescheduleBooking(b)} className="gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5" /> Reporter
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDisputeBooking(b)} className="gap-1.5 text-amber-600 hover:text-amber-700">
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
                            <Button size="sm" variant="ghost" onClick={() => setDisputeBooking(b)} className="gap-1.5 text-amber-600 hover:text-amber-700">
                              <Scale className="w-3.5 h-3.5" /> Litige
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReportBooking(b)} className="gap-1.5 text-destructive hover:text-destructive">
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

      <AnomalyReportDialog booking={reportBooking} onClose={() => setReportBooking(null)} />
      <DisputeDialog booking={disputeBooking} onClose={() => setDisputeBooking(null)} />
      <RescheduleDialog booking={rescheduleBooking} onClose={() => setRescheduleBooking(null)} />
    </div>
  );
};

export default ClientPrestationsHistory;
