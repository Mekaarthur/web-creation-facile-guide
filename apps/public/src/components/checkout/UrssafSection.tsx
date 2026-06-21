import { BadgePercent } from 'lucide-react';

interface Props {
  cartTotal: number;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  dialogOpen: boolean;
  onDialogOpen: () => void;
  onDialogClose: () => void;
}

export function UrssafSection({ cartTotal }: Props) {
  const eligibleAmount = cartTotal;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💰</span>
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 text-base flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            Crédit d'impôt 50% sur ce service
          </h3>
          <p className="text-green-700 text-sm mt-1">
            Ce service est éligible au crédit d'impôt pour l'emploi à domicile.
            Vous récupérez{' '}
            <strong>50% de vos dépenses</strong>
            {' '}lors de votre déclaration annuelle de revenus.
          </p>
          <div className="mt-3 bg-white rounded-lg p-3 text-sm border border-green-100 space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Vous payez aujourd'hui :</span>
              <span className="font-semibold text-gray-900">{eligibleAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>Récupéré en fin d'année :</span>
              <span className="font-semibold">-{(eligibleAmount * 0.5).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Votre coût réel :</span>
              <span className="text-green-700">{(eligibleAmount * 0.5).toFixed(2)}€</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span>📄</span>
            <span>
              Attestation fiscale disponible dans votre espace personnel chaque janvier.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
