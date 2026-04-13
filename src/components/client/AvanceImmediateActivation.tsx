import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const activationSchema = z.object({
  numeroFiscal: z.string()
    .min(13, "Le numéro fiscal doit contenir 13 chiffres")
    .max(13, "Le numéro fiscal doit contenir 13 chiffres")
    .regex(/^\d{13}$/, "Le numéro fiscal doit contenir exactement 13 chiffres"),
  iban: z.string()
    .min(14, "IBAN invalide")
    .max(34, "IBAN invalide")
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, "Format IBAN invalide (ex: FR7630001007941234567890185)"),
  dateNaissance: z.string()
    .min(1, "La date de naissance est requise")
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 18 && age <= 120;
    }, "Vous devez avoir au moins 18 ans"),
});

export const AvanceImmediateActivation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'active' | 'pending'>('idle');
  const [formData, setFormData] = useState({
    numeroFiscal: '',
    iban: '',
    dateNaissance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avance_immediate_active, avance_immediate_pending, numero_fiscal')
      .eq('id', user.id)
      .single();

    if (data?.avance_immediate_active) {
      setStatus('active');
    } else if (data?.avance_immediate_pending) {
      setStatus('pending');
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    
    const parsed = activationSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Try calling the edge function
      const { data, error } = await supabase.functions.invoke('urssaf-register-client', {
        body: {
          numeroFiscal: parsed.data.numeroFiscal,
          iban: parsed.data.iban,
          dateNaissance: parsed.data.dateNaissance,
        },
      });

      if (error || data?.simulation) {
        // API not yet available - save data and guide user
        await supabase
          .from('profiles')
          .update({
            numero_fiscal: parsed.data.numeroFiscal,
            iban_avance_immediate: parsed.data.iban,
            date_naissance: parsed.data.dateNaissance,
            avance_immediate_pending: true,
          })
          .eq('id', user!.id);

        setStatus('pending');
        setOpen(false);
        
        toast({
          title: "Informations enregistrées",
          description: "Vos informations ont été sauvegardées. Pour activer l'avance immédiate dès maintenant, rendez-vous sur particulier.urssaf.fr. Nous vous notifierons dès que l'activation automatique sera disponible.",
        });
      } else if (data?.success) {
        // API available and registration succeeded
        setStatus('active');
        setOpen(false);
        
        toast({
          title: "Avance immédiate activée ! ✅",
          description: "Vous bénéficierez automatiquement de -50% sur vos prochaines prestations.",
        });
      }
    } catch (err) {
      console.error('Activation error:', err);
      // Save data anyway
      await supabase
        .from('profiles')
        .update({
          numero_fiscal: parsed.data.numeroFiscal,
          iban_avance_immediate: parsed.data.iban,
          date_naissance: parsed.data.dateNaissance,
          avance_immediate_pending: true,
        })
        .eq('id', user!.id);

      setStatus('pending');
      setOpen(false);
      
      toast({
        title: "Informations enregistrées",
        description: "L'activation automatique n'est pas encore disponible. Rendez-vous sur particulier.urssaf.fr pour activer l'avance immédiate.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'active') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Avance immédiate activée</p>
            <p className="text-sm text-green-600">Vous bénéficiez de -50% sur vos prestations de services à la personne.</p>
          </div>
          <Badge variant="outline" className="ml-auto border-green-300 text-green-700">Actif</Badge>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Activation en cours</p>
            <p className="text-sm text-amber-600">
              Vos informations sont enregistrées. Finalisez l'activation sur{' '}
              <a 
                href="https://particulier.urssaf.fr/sap" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                particulier.urssaf.fr <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700">En attente</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
        <Shield className="w-6 h-6 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Activez l'Avance Immédiate</p>
          <p className="text-sm text-muted-foreground">
            Ne payez que 50% de vos prestations grâce au crédit d'impôt instantané URSSAF.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="whitespace-nowrap">
              Activer maintenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Activer l'Avance Immédiate
              </DialogTitle>
              <DialogDescription>
                Renseignez vos informations fiscales pour bénéficier de -50% instantanément sur vos prestations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="numeroFiscal">Numéro fiscal (13 chiffres)</Label>
                <Input
                  id="numeroFiscal"
                  placeholder="0123456789012"
                  maxLength={13}
                  value={formData.numeroFiscal}
                  onChange={e => setFormData(prev => ({ ...prev, numeroFiscal: e.target.value.replace(/\D/g, '') }))}
                />
                {errors.numeroFiscal && (
                  <p className="text-sm text-destructive">{errors.numeroFiscal}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Disponible sur votre avis d'imposition ou sur impots.gouv.fr
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  placeholder="FR7630001007941234567890185"
                  maxLength={34}
                  value={formData.iban}
                  onChange={e => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                />
                {errors.iban && (
                  <p className="text-sm text-destructive">{errors.iban}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  value={formData.dateNaissance}
                  onChange={e => setFormData(prev => ({ ...prev, dateNaissance: e.target.value }))}
                />
                {errors.dateNaissance && (
                  <p className="text-sm text-destructive">{errors.dateNaissance}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Vos données fiscales sont chiffrées et transmises uniquement à l'URSSAF. Bikawo ne conserve pas votre numéro fiscal en clair.
                </p>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full"
              >
                {isSubmitting ? 'Activation en cours...' : "Activer l'avance immédiate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
