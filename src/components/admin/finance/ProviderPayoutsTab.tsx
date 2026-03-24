import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, Clock, Send, Download, Loader2, 
  BanknoteIcon, CreditCard, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

interface ProviderPayout {
  provider_id: string;
  provider_name: string;
  stripe_connected: boolean;
  total_due: number;
  transaction_count: number;
  transactions: any[];
}

export const ProviderPayoutsTab = () => {
  const [payouts, setPayouts] = useState<ProviderPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select(`
          *,
          provider:providers(id, business_name, stripe_account_id, stripe_onboarding_complete, profiles(first_name, last_name))
        `)
        .in("payment_status", ["client_paid", "paid", "completed"])
        .is("provider_paid_at", null);

      if (error) throw error;

      // Group by provider
      const grouped: Record<string, ProviderPayout> = {};
      data?.forEach((t: any) => {
        const pid = t.provider_id;
        if (!grouped[pid]) {
          const provider = t.provider;
          grouped[pid] = {
            provider_id: pid,
            provider_name: provider?.business_name || 
              `${provider?.profiles?.first_name || ""} ${provider?.profiles?.last_name || ""}`.trim() || "Inconnu",
            stripe_connected: !!provider?.stripe_account_id && !!provider?.stripe_onboarding_complete,
            total_due: 0,
            transaction_count: 0,
            transactions: [],
          };
        }
        grouped[pid].total_due += Number(t.provider_payment);
        grouped[pid].transaction_count++;
        grouped[pid].transactions.push(t);
      });

      setPayouts(Object.values(grouped).sort((a, b) => b.total_due - a.total_due));
    } catch (error: any) {
      console.error("Error loading payouts:", error);
      toast.error("Erreur de chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  const handleStripeTransfer = async (payout: ProviderPayout) => {
    setProcessing(payout.provider_id);
    try {
      const transactionIds = payout.transactions.map((t: any) => t.id);
      const { data, error } = await supabase.functions.invoke("transfer-provider-payment", {
        body: { action: "transfer_bulk", transactionIds },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${data.successCount} paiement(s) envoyé(s) via Stripe - ${data.totalAmount?.toFixed(2)}€`);
      loadPayouts();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du transfert");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkManualPaid = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("transfer-provider-payment", {
        body: { action: "mark_manual_paid", transactionId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Marqué comme payé manuellement");
      loadPayouts();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["Prestataire", "Montant dû (€)", "Nb missions", "Stripe Connect", "Transactions IDs"];
    const rows = payouts.map((p) => [
      p.provider_name,
      p.total_due.toFixed(2),
      p.transaction_count,
      p.stripe_connected ? "Oui" : "Non",
      p.transactions.map((t: any) => t.id).join(" | "),
    ]);

    const csv = BOM + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements-prestataires-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Récapitulatif exporté");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Paiements Prestataires En Attente</h3>
          <p className="text-sm text-muted-foreground">
            {payouts.length} prestataire(s) · {payouts.reduce((s, p) => s + p.total_due, 0).toFixed(2)}€ à verser
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={payouts.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exporter récapitulatif
        </Button>
      </div>

      {payouts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            Tous les prestataires sont payés
          </CardContent>
        </Card>
      ) : (
        payouts.map((payout) => (
          <Card key={payout.provider_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium text-base">{payout.provider_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {payout.transaction_count} mission(s)
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {payout.stripe_connected ? (
                        <Badge variant="default" className="text-xs flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Stripe Connect
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Virement manuel
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold">{payout.total_due.toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">à verser</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {payout.stripe_connected ? (
                      <Button
                        size="sm"
                        onClick={() => handleStripeTransfer(payout)}
                        disabled={processing === payout.provider_id}
                      >
                        {processing === payout.provider_id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-1" />
                        )}
                        Payer via Stripe
                      </Button>
                    ) : null}
                    
                    {payout.transactions.map((t: any) => (
                      <Button
                        key={t.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkManualPaid(t.id)}
                      >
                        <BanknoteIcon className="w-4 h-4 mr-1" />
                        Marquer payé ({Number(t.provider_payment).toFixed(2)}€)
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
