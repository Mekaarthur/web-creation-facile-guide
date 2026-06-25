import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FormState = {
  company_name: string;
  siret: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  postal_code: string;
  surface_m2: string;
  service_type: string;
  frequency: string;
  employee_count: string;
  message: string;
};

const EMPTY: FormState = {
  company_name: "",
  siret: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  city: "",
  postal_code: "",
  surface_m2: "",
  service_type: "",
  frequency: "",
  employee_count: "",
  message: "",
};

const SERVICE_TYPES = [
  { value: "menage-bureaux-small", label: "Ménage bureaux ≤100m²" },
  { value: "menage-bureaux-medium", label: "Ménage bureaux 100-200m²" },
  { value: "menage-bureaux-devis", label: "Ménage bureaux >200m² (sur devis)" },
  { value: "support-administratif", label: "Support administratif" },
  { value: "assistance-dirigeants", label: "Assistance dirigeants" },
  { value: "conciergerie-entreprise", label: "Conciergerie d'entreprise" },
  { value: "assistance-administrative-pro", label: "Assistance administrative" },
  { value: "multi", label: "Plusieurs services (à préciser dans le message)" },
];

const FREQUENCIES = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "biweekly", label: "Bihebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "one_time", label: "Ponctuel" },
];

const EnterpriseQuoteForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const setSelect = (field: keyof FormState) => (value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.contact_email ||
        !form.address || !form.city || !form.postal_code || !form.service_type) {
      toast({ title: "Champs obligatoires manquants", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-enterprise-quote", {
        body: {
          company_name: form.company_name.trim(),
          siret: form.siret.trim() || null,
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim().toLowerCase(),
          contact_phone: form.contact_phone.trim() || null,
          address: form.address.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          surface_m2: form.surface_m2 ? parseInt(form.surface_m2, 10) : null,
          service_type: form.service_type,
          frequency: form.frequency || null,
          employee_count: form.employee_count ? parseInt(form.employee_count, 10) : null,
          message: form.message.trim() || null,
        },
      });

      if (error) throw error;

      navigate("/devis-confirme", {
        state: { quoteNumber: data?.quote_number, email: form.contact_email },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-border p-8 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Nom de l'entreprise *</Label>
          <Input id="company_name" value={form.company_name} onChange={set("company_name")}
            placeholder="Acme SAS" required />
        </div>
        <div>
          <Label htmlFor="siret">SIRET (optionnel)</Label>
          <Input id="siret" value={form.siret} onChange={set("siret")}
            placeholder="123 456 789 00012" maxLength={17} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_name">Nom du contact *</Label>
          <Input id="contact_name" value={form.contact_name} onChange={set("contact_name")}
            placeholder="Marie Dupont" required />
        </div>
        <div>
          <Label htmlFor="contact_email">Email professionnel *</Label>
          <Input id="contact_email" type="email" value={form.contact_email}
            onChange={set("contact_email")} placeholder="marie@acme.fr" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_phone">Téléphone</Label>
          <Input id="contact_phone" type="tel" value={form.contact_phone}
            onChange={set("contact_phone")} placeholder="06 12 34 56 78" />
        </div>
        <div>
          <Label htmlFor="employee_count">Nombre de salariés</Label>
          <Input id="employee_count" type="number" min={1} value={form.employee_count}
            onChange={set("employee_count")} placeholder="25" />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Adresse du site *</Label>
        <Input id="address" value={form.address} onChange={set("address")}
          placeholder="10 rue de Rivoli" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" value={form.city} onChange={set("city")}
            placeholder="Paris" required />
        </div>
        <div>
          <Label htmlFor="postal_code">Code postal *</Label>
          <Input id="postal_code" value={form.postal_code} onChange={set("postal_code")}
            placeholder="75001" maxLength={5} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Service souhaité *</Label>
          <Select onValueChange={setSelect("service_type")} required>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un service" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fréquence</Label>
          <Select onValueChange={setSelect("frequency")}>
            <SelectTrigger>
              <SelectValue placeholder="Fréquence" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="surface_m2">Surface (m²)</Label>
          <Input id="surface_m2" type="number" min={1} value={form.surface_m2}
            onChange={set("surface_m2")} placeholder="120" />
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message / précisions</Label>
        <Textarea id="message" value={form.message} onChange={set("message")}
          placeholder="Horaires souhaités, particularités du site, nombre de sites…"
          rows={3} maxLength={1000} />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Envoi en cours…" : "Envoyer ma demande de devis"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        En soumettant ce formulaire vous acceptez notre{" "}
        <a href="/cgu" className="underline">politique de confidentialité</a>.
        Aucun engagement, devis gratuit.
      </p>
    </form>
  );
};

export default EnterpriseQuoteForm;
