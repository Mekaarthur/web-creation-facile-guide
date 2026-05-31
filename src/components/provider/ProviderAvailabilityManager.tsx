import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { format, parseISO, isFuture, isPast, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Absence {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string | null;
  created_at: string;
}

interface AvailabilityData {
  providerId: string;
  absences: Absence[];
}

const REASON_CONFIG: Record<string, { label: string; color: string }> = {
  vacances:  { label: 'Vacances',           color: 'bg-blue-100 text-blue-800' },
  maladie:   { label: 'Maladie / Arrêt',    color: 'bg-red-100 text-red-800' },
  formation: { label: 'Formation',          color: 'bg-purple-100 text-purple-800' },
  personnel: { label: 'Raison personnelle', color: 'bg-orange-100 text-orange-800' },
  autre:     { label: 'Autre',              color: 'bg-gray-100 text-gray-800' },
};

const today = new Date().toISOString().split('T')[0];

async function fetchAvailabilityData(userId: string): Promise<AvailabilityData | null> {
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (!provider) return null;

  const { data, error } = await supabase
    .from('provider_absences')
    .select('*')
    .eq('provider_id', provider.id)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return { providerId: provider.id, absences: data || [] };
}

export const ProviderAvailabilityManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: 'vacances', notes: '' });

  const AVAIL_KEY = ['provider-availability', user?.id] as const;

  const { data, isLoading } = useQuery<AvailabilityData | null>({
    queryKey: AVAIL_KEY,
    queryFn: () => fetchAvailabilityData(user!.id),
    enabled: !!user,
  });

  const providerId = data?.providerId ?? null;
  const absences = data?.absences ?? [];

  const handleSave = async () => {
    if (!form.start_date || !form.end_date) {
      toast({ title: 'Dates manquantes', description: 'Veuillez saisir début et fin.', variant: 'destructive' });
      return;
    }
    if (form.end_date < form.start_date) {
      toast({ title: 'Dates incorrectes', description: 'La date de fin doit être après le début.', variant: 'destructive' });
      return;
    }
    if (!providerId) return;

    setSaving(true);
    const { error } = await supabase.from('provider_absences').insert({
      provider_id: providerId,
      start_date:  form.start_date,
      end_date:    form.end_date,
      reason:      form.reason,
      notes:       form.notes || null,
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Indisponibilité enregistrée', description: 'Votre calendrier a été mis à jour.' });
      setDialogOpen(false);
      setForm({ start_date: '', end_date: '', reason: 'vacances', notes: '' });
      qc.invalidateQueries({ queryKey: AVAIL_KEY });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('provider_absences').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      qc.setQueryData<AvailabilityData | null>(AVAIL_KEY, (prev) => {
        if (!prev) return prev;
        return { ...prev, absences: prev.absences.filter(a => a.id !== id) };
      });
    }
  };

  const upcoming = absences.filter(a => !isPast(parseISO(a.end_date)));
  const past     = absences.filter(a =>  isPast(parseISO(a.end_date)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Mes indisponibilités
          </CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {upcoming.length === 0 && past.length === 0 && (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <Calendar className="w-10 h-10 mx-auto opacity-30" />
                <p className="font-medium">Aucune indisponibilité enregistrée</p>
                <p className="text-sm">Signalez vacances, arrêts ou absences pour informer les clients.</p>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">À venir / en cours</h4>
                {upcoming.map(a => {
                  const cfg = REASON_CONFIG[a.reason] ?? REASON_CONFIG.autre;
                  const days = differenceInDays(parseISO(a.end_date), parseISO(a.start_date)) + 1;
                  const isActive = !isFuture(parseISO(a.start_date)) && !isPast(parseISO(a.end_date));
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50/40">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {isActive
                            ? <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">En cours</Badge>
                            : <Badge variant="outline" className="text-xs">À venir</Badge>
                          }
                        </div>
                        <p className="text-sm font-medium">
                          {format(parseISO(a.start_date), 'd MMM', { locale: fr })} →{' '}
                          {format(parseISO(a.end_date), 'd MMM yyyy', { locale: fr })}
                          <span className="text-muted-foreground ml-2 text-xs">({days} jour{days > 1 ? 's' : ''})</span>
                        </p>
                        {a.notes && <p className="text-xs text-muted-foreground truncate">{a.notes}</p>}
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleDelete(a.id)}
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passées</h4>
                {past.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                    <div>
                      <span className="text-xs text-muted-foreground">{REASON_CONFIG[a.reason]?.label}</span>
                      <p className="text-sm">
                        {format(parseISO(a.start_date), 'd MMM', { locale: fr })} →{' '}
                        {format(parseISO(a.end_date), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Les missions déjà confirmées ne seront pas annulées automatiquement. Si vous avez des missions prévues durant cette période, contactez le support.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Ajouter une indisponibilité
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Début</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  min={today}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || today}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motif</Label>
              <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                placeholder="Ex : vacances en famille, indisponible pour appels..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProviderAvailabilityManager;
