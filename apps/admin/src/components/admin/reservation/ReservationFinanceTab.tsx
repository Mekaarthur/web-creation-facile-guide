import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { DollarSign, CreditCard } from "lucide-react";
import { Financials, FinancialTransaction } from "./types";

interface Props {
  financials: Financials;
  financialTransaction: FinancialTransaction | null;
}

export function ReservationFinanceTab({ financials, financialTransaction }: Props) {
  return (
    <TabsContent value="finance" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Répartition financière
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix horaire client:</span>
              <span className="font-medium">{financials.hourlyRate.toFixed(2)}€/h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix horaire prestataire:</span>
              <span className="font-medium">{financials.providerPerHour.toFixed(2)}€/h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commission horaire Bikawo:</span>
              <span className="font-medium">{financials.commissionPerHour.toFixed(2)}€/h</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Durée:</span>
              <span className="font-medium">{financials.duration}h</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Client paye</p>
              <p className="text-2xl font-bold text-primary">
                {financials.totalClient.toFixed(2)}€
              </p>
              <p className="text-xs text-muted-foreground">{financials.hourlyRate.toFixed(2)}€/h × {financials.duration}h</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <p className="text-sm text-muted-foreground mb-1">Prestataire reçoit</p>
              <p className="text-2xl font-bold text-green-600">
                {financials.totalProvider.toFixed(2)}€
              </p>
              <p className="text-xs text-muted-foreground">{financials.providerPerHour.toFixed(2)}€/h × {financials.duration}h</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
              <p className="text-sm text-muted-foreground mb-1">Commission Bikawo</p>
              <p className="text-2xl font-bold text-amber-600">
                {financials.totalCommission.toFixed(2)}€
              </p>
              <p className="text-xs text-muted-foreground">{financials.commissionPerHour.toFixed(2)}€/h × {financials.duration}h</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Commission: <span className="font-semibold text-amber-900 dark:text-amber-100">{financials.commissionPercentage}%</span> du prix horaire
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mode de paiement</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Stripe / Carte bancaire
                </p>
              </div>
              <Badge variant={
                financialTransaction?.payment_status === 'completed' ? 'default' :
                financialTransaction?.payment_status === 'pending' ? 'secondary' : 'outline'
              }>
                {financialTransaction?.payment_status === 'completed' ? 'Payé' :
                 financialTransaction?.payment_status === 'pending' ? 'En attente' : 'Non payé'}
              </Badge>
            </div>

            {financialTransaction && (
              <>
                {financialTransaction.client_paid_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Date paiement client: </span>
                    <span className="font-medium">
                      {new Date(financialTransaction.client_paid_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">ID transaction: </span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {financialTransaction.id.substring(0, 16)}...
                  </code>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
