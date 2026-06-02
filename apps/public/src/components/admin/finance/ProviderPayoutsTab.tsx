import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle, Clock, Send, Download, Loader2,
  BanknoteIcon, CreditCard, AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface ProviderPayout {
  provider_id: string;
  provider_name: string;
  stripe_connected: boolean;
  payout_frequency: string;
  total_due: number;
  transaction_count: number;
  ready_count: number;
  blocked_count: number;
  transactions: any[];
}

const QUERY_KEY = ['admin-provider-payouts'] as const;

async function fetchPayouts(): Promise<ProviderPayout[]> {
  const { data, error } = await supabase
    .from("financial_transactions")
    .select(`
      *,
      provider:providers(id, business_name, stripe_account_id, stripe_onboarding_complete, payout_frequency, profiles(first_name, last_name))
    `)
    .in("payment_status", ["client_paid", "paid", "completed", "ready_for_payout", "needs_stripe_setup"])
    .is("provider_paid_at", null);

  if (error) throw error;

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
        payout_frequency: provider?.payout_frequency || "weekly",
        total_due: 0,
        transaction_count: 0,
        ready_count: 0,
        blocked_count: 0,
        transactions: [],
      };
    }
    grouped[pid].total_due += Number(t.provider_payment);
    grouped[pid].transaction_count++;
    if (t.payment_status === "ready_for_payout") grouped[pid].ready_count++;
    if (t.payment_status === "needs_stripe_setup") grouped[pid].blocked_count++;
    grouped[pid].transactions.push(t);
  });

  return Object.values(grouped).sort((a, b) => b.total_due - a.total_due);
}

export const ProviderPayoutsTab = () => {
  const qc = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: payouts = [], isLoading: loading, refetch } = useQuery<ProviderPayout[]>({
    queryKey: QUERY_KEY,
    queryFn: fetchPayouts,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

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
      invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du transfert");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllManualPaid = async (payout: ProviderPayout) => {
    setProcessing(payout.provider_id);
    try {
      for (const t of payout.transactions) {
        await supabase.functions.invoke("transfer-provider-payment", {
          body: { action: "mark_manual_paid", transactionId: t.id },
        });
      }
      toast.success(`${payout.transaction_count} transaction(s) marquée(s) payées manuellement`);
      invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    } finally {
      setProcessing(null);
    }
  };

  const handleExportCSV = () => {
    const BOM = "﻿";
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Actualiser
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={payouts.length === 0}>
            <Download className="w-4 h-4 mr-2" />Exporter récapitulatif
          </Button>
        </div>
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
          <Card key={payout.provider_id} className={payout.ready_count > 0 ? "border-green-300" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="font-medium text-base">{payout.provider_name}</div>
                  <div className="text-sm text-muted-foreground">{payout.transaction_count} mission(s)</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {payout.stripe_connected ? (
                      <Badge variant="default" className="text-xs flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />Stripe Connect
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />Virement manuel
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {payout.payout_frequency === "monthly" ? "Mensuel" : "Hebdomadaire"}
                    </Badge>
                    {payout.ready_count > 0 && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />{payout.ready_count} prêt(s) au virement
                      </Badge>
                    )}
                    {payout.blocked_count > 0 && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{payout.blocked_count} bloqué(s) — Stripe non configuré
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-bold">{payout.total_due.toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">à verser</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {payout.stripe_connected && (
                      <Button size="sm" onClick={() => handleStripeTransfer(payout)} disabled={processing === payout.provider_id}>
                        {processing === payout.provider_id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                        Payer via Stripe
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleMarkAllManualPaid(payout)} disabled={processing === payout.provider_id}>
                      {processing === payout.provider_id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BanknoteIcon className="w-4 h-4 mr-1" />}
                      Marquer payé manuellement
                    </Button>
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
