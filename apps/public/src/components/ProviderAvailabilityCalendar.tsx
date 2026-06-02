import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { Clock, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProviderAvailability } from '@/types/provider';

interface ProviderAvailabilityProps {
  providerId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

export function ProviderAvailabilityCalendar({ providerId }: ProviderAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<ProviderAvailability[]>([]);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [providerId]);

  const loadAvailability = async () => {
    try {
      // Utilisation du client brut pour accéder aux nouvelles tables
      const { data, error } = await (supabase as any)
        .from('provider_availability')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week');

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des disponibilités:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les disponibilités",
        variant: "destructive"
      });
    }
  };

  const addTimeSlot = async () => {
    if (!newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('provider_availability')
        .insert([{
          provider_id: providerId,
          day_of_week: newSlot.day_of_week,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_available: true
        }]);

      if (error) throw error;

      await loadAvailability();
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      });

      toast({
        title: "Succès",
        description: "Créneaux de disponibilité ajoutés"
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les créneaux",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTimeSlot = async (slotId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('provider_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      await loadAvailability();

      toast({
        title: "Succès",
        description: "Créneau supprimé"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le créneau",
        variant: "destructive"
      });
    }
  };

  const toggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('provider_availability')
        .update({ is_available: !currentStatus })
        .eq('id', slotId);

      if (error) throw error;
      await loadAvailability();

      toast({
        title: "Succès",
        description: "Disponibilité mise à jour"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la disponibilité",
        variant: "destructive"
      });
    }
  };

  const getDaySlots = (dayOfWeek: number) => {
    return timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
  };

  return (
    <div className="space-y-6">
      {/* Calendrier pour visualiser les disponibilités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendrier des disponibilités
          </CardTitle>
          <CardDescription>
            Visualisez et gérez vos créneaux de disponibilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            locale={fr}
          />
        </CardContent>
      </Card>

      {/* Gestion des créneaux horaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Créneaux de disponibilité
          </CardTitle>
          <CardDescription>
            Définissez vos horaires de disponibilité par jour de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ajouter un nouveau créneau */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-4">Ajouter un nouveau créneau</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Jour de la semaine</Label>
                <Select
                  value={newSlot.day_of_week.toString()}
                  onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addTimeSlot} 
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Liste des créneaux existants */}
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = getDaySlots(day.value);
              return (
                <div key={day.value} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {day.label}
                  </h4>
                  {daySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun créneau défini
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 p-2 border rounded-lg bg-background"
                        >
                          <Badge variant={slot.is_available ? "default" : "secondary"}>
                            {slot.start_time} - {slot.end_time}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                          >
                            {slot.is_available ? "Désactiver" : "Activer"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimeSlot(slot.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}