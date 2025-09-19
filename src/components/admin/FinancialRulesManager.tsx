import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, X, Plus } from 'lucide-react';

interface FinancialRule {
  id: string;
  service_category: string;
  provider_payment: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FinancialRulesManager = () => {
  const [rules, setRules] = useState<FinancialRule[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ provider_payment: number }>({ provider_payment: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ service_category: '', provider_payment: 18 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categoryLabels: Record<string, string> = {
    'bika_kids': 'Bika Kids',
    'bika_maison': 'Bika Maison',
    'bika_vie': 'Bika Vie',
    'bika_travel': 'Bika Travel',
    'entretien_espaces_verts': 'Entretien & Espaces Verts',
    'maintenance': 'Maintenance',
    'bika_seniors': 'Bika Seniors',
    'bika_animals': 'Bika Animals',
    'bika_pro': 'Bika Pro',
    'bika_plus': 'Bika Plus'
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_rules')
        .select('*')
        .order('service_category');

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles financières",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: FinancialRule) => {
    setEditingId(rule.id);
    setEditValues({ provider_payment: rule.provider_payment });
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_rules')
        .update({ provider_payment: editValues.provider_payment })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Règle mise à jour avec succès",
      });

      setEditingId(null);
      fetchRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la règle",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('financial_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Règle ${isActive ? 'activée' : 'désactivée'}`,
      });

      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la règle",
        variant: "destructive",
      });
    }
  };

  const handleAddRule = async () => {
    try {
      const { error } = await supabase
        .from('financial_rules')
        .insert([newRule]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Nouvelle règle ajoutée",
      });

      setNewRule({ service_category: '', provider_payment: 18 });
      setShowAddForm(false);
      fetchRules();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la règle",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Chargement des règles financières...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Règles Financières</h1>
          <p className="text-muted-foreground">
            Gérez les tarifs de rémunération des prestataires par catégorie de service
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une règle
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Règle Financière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie de Service</Label>
                <Input
                  id="category"
                  value={newRule.service_category}
                  onChange={(e) => setNewRule({ ...newRule, service_category: e.target.value })}
                  placeholder="ex: bika_premium"
                />
              </div>
              <div>
                <Label htmlFor="payment">Paiement Prestataire (€)</Label>
                <Input
                  id="payment"
                  type="number"
                  value={newRule.provider_payment}
                  onChange={(e) => setNewRule({ ...newRule, provider_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddRule}>Ajouter</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">
                      {categoryLabels[rule.service_category] || rule.service_category}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Code: {rule.service_category}
                    </p>
                  </div>
                  
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  {editingId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValues.provider_payment}
                        onChange={(e) => setEditValues({ provider_payment: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                      <span>€</span>
                      <Button size="sm" onClick={() => handleSave(rule.id)}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg">{rule.provider_payment}€</div>
                        <div className="text-sm text-muted-foreground">
                          Commission: Variable selon prix client
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
          <CardDescription>
            Explication du système de commission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Prix client:</strong> Le tarif affiché et payé par le client</p>
            <p><strong>Paiement prestataire:</strong> Montant fixe versé au prestataire selon sa catégorie</p>
            <p><strong>Commission entreprise:</strong> Prix client - Paiement prestataire</p>
            <p className="text-muted-foreground mt-4">
              Exemple: Client paie 50€ pour du Bika Kids → Prestataire reçoit 18€ → Commission entreprise = 32€
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialRulesManager;