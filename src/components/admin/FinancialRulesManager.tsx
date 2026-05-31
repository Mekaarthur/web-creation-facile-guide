import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, X, Users, Euro, TrendingUp } from 'lucide-react';

interface FinancialRule {
  id: string;
  service_category: string;
  client_price: number;
  provider_payment: number;
  is_active: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  bika_kids:     'Bika Kids',
  bika_maison:   'Bika Maison',
  bika_vie:      'Bika Vie',
  bika_travel:   'Bika Travel',
  bika_seniors:  'Bika Seniors',
  bika_animals:  'Bika Animals',
  bika_pro:      'Bika Pro',
  bika_plus:     'Bika Plus',
  bika_menage:   'Bika Ménage',
  entretien_espaces_verts: 'Entretien & Espaces Verts',
  maintenance:   'Maintenance',
};

const QUERY_KEY = ['financial-rules'] as const;

const FinancialRulesManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ client_price: 0, provider_payment: 0 });

  const { data: rules = [], isLoading: loading } = useQuery<FinancialRule[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_rules')
        .select('id, service_category, client_price, provider_payment, is_active')
        .order('service_category');
      if (error) throw error;
      return data || [];
    },
  });

  const handleEdit = (rule: FinancialRule) => {
    setEditingId(rule.id);
    setEditValues({ client_price: rule.client_price, provider_payment: rule.provider_payment });
  };

  const handleSave = async (id: string) => {
    if (editValues.provider_payment >= editValues.client_price) {
      toast({ title: "Erreur", description: "La part prestataire doit être inférieure au prix client", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase
        .from('financial_rules')
        .update({ client_price: editValues.client_price, provider_payment: editValues.provider_payment })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Tarifs mis à jour", description: "Les nouveaux prix sont actifs immédiatement." });
      setEditingId(null);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('financial_rules').update({ is_active: isActive }).eq('id', id);
    if (!error) { toast({ title: isActive ? "Activé" : "Désactivé" }); qc.invalidateQueries({ queryKey: QUERY_KEY }); }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Règles Financières</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prix client + rémunération prestataire par univers — source de vérité pour la facturation Stripe
        </p>
      </div>

      <div className="hidden md:grid grid-cols-[1fr_110px_110px_80px_90px_40px] gap-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Univers</span>
        <span className="text-center">Prix client</span>
        <span className="text-center">Part prestataire</span>
        <span className="text-center">Marge</span>
        <span className="text-center">Statut</span>
        <span />
      </div>

      <div className="space-y-2">
        {rules.map((rule) => {
          const margin    = rule.client_price - rule.provider_payment;
          const marginPct = rule.client_price > 0 ? Math.round((margin / rule.client_price) * 100) : 0;
          const isEditing = editingId === rule.id;

          return (
            <Card key={rule.id} className={`transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_110px_110px_80px_90px_40px] gap-3 items-center">
                  <div>
                    <p className="font-semibold">{CATEGORY_LABELS[rule.service_category] || rule.service_category}</p>
                    <p className="text-xs text-muted-foreground">Code: {rule.service_category}</p>
                  </div>

                  <div className="text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input type="number" min="1" step="0.5" value={editValues.client_price}
                          onChange={(e) => setEditValues(v => ({ ...v, client_price: parseFloat(e.target.value) || 0 }))}
                          className="w-20 h-8 text-center text-sm" />
                        <span className="text-xs text-muted-foreground">€</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 font-semibold text-foreground">
                        <Users className="w-3.5 h-3.5 text-blue-500" />{rule.client_price.toFixed(2)} €
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">client/h</p>
                  </div>

                  <div className="text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input type="number" min="1" step="0.5" value={editValues.provider_payment}
                          onChange={(e) => setEditValues(v => ({ ...v, provider_payment: parseFloat(e.target.value) || 0 }))}
                          className="w-20 h-8 text-center text-sm" />
                        <span className="text-xs text-muted-foreground">€</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 font-semibold text-green-700">
                        <Euro className="w-3.5 h-3.5" />{rule.provider_payment.toFixed(2)} €
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">presta/h</p>
                  </div>

                  <div className="text-center">
                    {isEditing ? (
                      <div className="text-xs text-muted-foreground text-center">
                        <p className="font-medium text-foreground">{(editValues.client_price - editValues.provider_payment).toFixed(2)} €</p>
                        <p>{editValues.client_price > 0 ? Math.round(((editValues.client_price - editValues.provider_payment) / editValues.client_price) * 100) : 0} %</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-1 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />{margin.toFixed(2)} €
                        </div>
                        <p className="text-xs text-muted-foreground">{marginPct} %</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Switch checked={rule.is_active} onCheckedChange={(v) => handleToggle(rule.id, v)} disabled={isEditing} />
                  </div>

                  <div className="flex justify-end gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleSave(rule.id)}><Save className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(rule)}><Pencil className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Comment ça marche ?</p>
          <p>• <strong>Prix client</strong> = ce que paie le client à la réservation (utilisé par Stripe)</p>
          <p>• <strong>Part prestataire</strong> = ce que reçoit le prestataire après la mission</p>
          <p>• <strong>Marge Bikawo</strong> = Prix client − Part prestataire − Commission Stripe (~1,4% + 0,25€)</p>
          <p className="text-xs mt-2 text-amber-600">⚠ Ces tarifs s'appliquent à toutes les nouvelles réservations. Les réservations existantes ne sont pas modifiées.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialRulesManager;
