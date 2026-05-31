import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Zap, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

interface Props {
  open: boolean;
  selectedService: any;
  minRating: number;
  maxPrice: number;
  onMinRatingChange: (v: number) => void;
  onMaxPriceChange: (v: number) => void;
  onFiltersChange: () => void;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export function BookingFormDialog({ open, selectedService, minRating, maxPrice, onMinRatingChange, onMaxPriceChange, onFiltersChange, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState({ startDate: undefined as Date | undefined, endDate: undefined as Date | undefined, startTime: '', endTime: '' });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeSlots([]);
      setCurrentSlot({ startDate: undefined, endDate: undefined, startTime: '', endTime: '' });
      setLocation('');
      setNotes('');
    }
  }, [open]);

  const addTimeSlot = () => {
    if (!currentSlot.startDate || !currentSlot.endDate || !currentSlot.startTime || !currentSlot.endTime) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs de la plage', variant: 'destructive' });
      return;
    }
    if (currentSlot.endDate < currentSlot.startDate) {
      toast({ title: 'Erreur', description: 'La date de fin doit être postérieure à la date de début', variant: 'destructive' });
      return;
    }
    if (currentSlot.startTime >= currentSlot.endTime) {
      toast({ title: 'Erreur', description: "L'heure de fin doit être postérieure à l'heure de début", variant: 'destructive' });
      return;
    }
    setTimeSlots(prev => [...prev, { startDate: currentSlot.startDate!, endDate: currentSlot.endDate!, startTime: currentSlot.startTime, endTime: currentSlot.endTime }]);
    setCurrentSlot({ startDate: undefined, endDate: undefined, startTime: '', endTime: '' });
    toast({ title: 'Plage ajoutée', description: 'La plage de dates a été ajoutée avec succès' });
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    if (!selectedService) return 0;
    return timeSlots.reduce((total, slot) => {
      const hours = parseInt(slot.endTime) - parseInt(slot.startTime);
      const days = Math.ceil((slot.endDate.getTime() - slot.startDate.getTime()) / 86400000) + 1;
      return total + selectedService.price_per_hour * hours * days;
    }, 0);
  };

  const handleBooking = async () => {
    if (!selectedService || timeSlots.length === 0 || !location) {
      toast({ title: 'Erreur', description: "Veuillez ajouter au moins un créneau et renseigner l'adresse", variant: 'destructive' });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté pour réserver', variant: 'destructive' });
        return;
      }

      const slotsDescription = timeSlots.map((slot, i) =>
        `Créneau ${i + 1}: du ${format(slot.startDate, 'dd/MM/yyyy')} au ${format(slot.endDate, 'dd/MM/yyyy')} · ${slot.startTime}–${slot.endTime}`
      ).join('\n');

      const createdId = crypto.randomUUID();
      const { error } = await supabase.from('custom_requests').insert([{
        id: createdId,
        client_name: user.email?.split('@')[0] || 'Client',
        client_email: user.email || '',
        service_description: `Service: ${selectedService.name}\n\n${slotsDescription}\n\nBudget estimé: ${getTotalPrice()}€`,
        location,
        preferred_date: format(timeSlots[0].startDate, 'yyyy-MM-dd'),
        preferred_time: timeSlots[0].startTime,
        additional_notes: notes || null,
        urgency_level: 'normal',
        status: 'new',
      }]);
      if (error) throw error;

      try {
        await supabase.functions.invoke('send-modern-notification', {
          body: {
            type: 'custom_request_received',
            recipient: { email: user.email, name: user.email?.split('@')[0], firstName: user.email?.split('@')[0] },
            data: { serviceDescription: selectedService.name, bookingDate: format(timeSlots[0].startDate, 'dd/MM/yyyy'), startTime: timeSlots[0].startTime, address: location, bookingId: createdId },
          },
        });
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }

      toast({ title: 'Commande reçue !', description: `Votre demande avec ${timeSlots.length} créneau(x) a été reçue. Nous vous assignons automatiquement le meilleur prestataire.` });
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast({ title: 'Erreur', description: 'Une erreur est survenue lors de l\'envoi de votre demande', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réserver - {selectedService?.name}</DialogTitle>
          <DialogDescription>Remplissez les informations ci-dessous pour réserver votre prestation</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Matching automatique activé
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-1" />Filtres
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                  <Navigation className="w-4 h-4 mr-1" />Carte
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Note minimum</Label>
                  <Select value={minRating.toString()} onValueChange={(v) => { onMinRatingChange(parseFloat(v)); onFiltersChange(); }}>
                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Toutes les notes</SelectItem>
                      <SelectItem value="3">3+ étoiles</SelectItem>
                      <SelectItem value="4">4+ étoiles</SelectItem>
                      <SelectItem value="4.5">4.5+ étoiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prix maximum (€/h)</Label>
                  <Input type="number" value={maxPrice || ''} onChange={(e) => { onMaxPriceChange(parseFloat(e.target.value) || 0); onFiltersChange(); }} placeholder="Sans limite" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Zap className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-primary">Attribution automatique</p>
              <p className="text-sm text-muted-foreground">Notre équipe vous assignera automatiquement le meilleur prestataire selon vos critères, votre localisation et les disponibilités.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Plages de prestation</Label>
              <Badge variant="outline">{timeSlots.length} plage(s)</Badge>
            </div>

            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Plages ajoutées :</Label>
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium">Du {format(slot.startDate, 'dd/MM', { locale: fr })} au {format(slot.endDate, 'dd/MM/yyyy', { locale: fr })}</span>
                        <span className="text-sm text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(index)} className="text-destructive hover:text-destructive">✕</Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-4">
              <Label className="text-sm font-medium">Ajouter une plage :</Label>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !currentSlot.startDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentSlot.startDate ? format(currentSlot.startDate, 'PPP', { locale: fr }) : 'Date début'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={currentSlot.startDate} onSelect={(date) => setCurrentSlot(s => ({ ...s, startDate: date }))} disabled={(date) => date < new Date()} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !currentSlot.endDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentSlot.endDate ? format(currentSlot.endDate, 'PPP', { locale: fr }) : 'Date fin'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={currentSlot.endDate} onSelect={(date) => setCurrentSlot(s => ({ ...s, endDate: date }))} disabled={(date) => date < new Date() || (currentSlot.startDate ? date < currentSlot.startDate : false)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure de début</Label>
                    <Select value={currentSlot.startTime} onValueChange={(v) => setCurrentSlot(s => ({ ...s, startTime: v }))}>
                      <SelectTrigger><SelectValue placeholder="Heure début" /></SelectTrigger>
                      <SelectContent>{AVAILABLE_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Select value={currentSlot.endTime} onValueChange={(v) => setCurrentSlot(s => ({ ...s, endTime: v }))}>
                      <SelectTrigger><SelectValue placeholder="Heure fin" /></SelectTrigger>
                      <SelectContent>{AVAILABLE_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addTimeSlot} variant="outline" className="w-full">Ajouter cette plage</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Adresse de la prestation</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Adresse complète" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Instructions particulières (optionnel)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Précisions, codes d'accès, instructions spéciales..." rows={3} />
          </div>

          {selectedService && timeSlots.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Prix total estimé :</span>
                <span className="text-xl font-bold text-primary">{getTotalPrice()}€</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {timeSlots.map((slot, i) => {
                  const hours = parseInt(slot.endTime) - parseInt(slot.startTime);
                  const days = Math.ceil((slot.endDate.getTime() - slot.startDate.getTime()) / 86400000) + 1;
                  return (
                    <div key={i} className="flex justify-between">
                      <span>Plage {i + 1}: {hours}h x {days} jour(s)</span>
                      <span>{selectedService.price_per_hour * hours * days}€</span>
                    </div>
                  );
                })}
                <div className="border-t pt-1 flex justify-between font-medium">
                  <span>Total</span><span>{getTotalPrice()}€</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleBooking} disabled={!selectedService || timeSlots.length === 0 || !location} className="bg-gradient-hero text-white hover:opacity-90">
            Envoyer ma demande ({timeSlots.length} créneau{timeSlots.length > 1 ? 'x' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
