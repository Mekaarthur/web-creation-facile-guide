import { BadgePercent, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  cartTotal: number;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  dialogOpen: boolean;
  onDialogOpen: () => void;
  onDialogClose: () => void;
}

const URSSAF_STEPS = [
  "Activez l'option lors du paiement",
  "Créez ou connectez votre compte sur cesu.urssaf.fr",
  "Validez votre identité et vos coordonnées fiscales",
  "Le crédit d'impôt est appliqué : vous ne payez que 50%",
  "Après la prestation, la déclaration est automatique",
];

export function UrssafSection({ cartTotal, enabled, onToggle, dialogOpen, onDialogOpen, onDialogClose }: Props) {
  return (
    <>
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="text-sm font-semibold">Avance immédiate d'impôts</h4>
                <p className="text-xs text-muted-foreground">50% déduit directement, vous ne payez que la moitié</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDialogOpen} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="En savoir plus sur l'avance immédiate">
                <Info className="w-4 h-4" />
              </button>
              <Switch checked={enabled} onCheckedChange={onToggle} />
            </div>
          </div>
          {enabled && (
            <div className="space-y-2">
              <p className="text-xs text-green-700 dark:text-green-400">
                ✅ Vous économisez {(cartTotal * 0.5).toFixed(2)}€ grâce au crédit d'impôt
              </p>
              <a href="https://www.cesu.urssaf.fr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                <ExternalLink className="w-3 h-3" />
                Activer votre compte CESU sur cesu.urssaf.fr
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={onDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-green-600" />
              Avance immédiate d'impôts
            </DialogTitle>
            <DialogDescription>
              Bénéficiez du crédit d'impôt de 50% directement lors du paiement grâce au dispositif URSSAF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {URSSAF_STEPS.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong>Plafond annuel :</strong> 12 000€ de dépenses soit 6 000€ de crédit d'impôt maximum.
                  En savoir plus sur{' '}
                  <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">impots.gouv.fr</a>
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <a href="https://www.cesu.urssaf.fr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <ExternalLink className="w-4 h-4" />
              Ouvrir cesu.urssaf.fr
            </a>
            <Button onClick={() => { onToggle(true); onDialogClose(); }}>
              Activer l'avance immédiate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
