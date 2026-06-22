import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ProviderCandidateForm } from '@/lib/validations';

interface Props {
  control: Control<ProviderCandidateForm>;
}

type DocFieldName = 'identity_document' | 'criminal_record' | 'siret_document' | 'rib_iban' | 'certification_nova' | 'rc_pro' | 'certifications';

interface DocField {
  name: DocFieldName;
  label: string;
  required: boolean;
  hint?: string;
}

const DOC_FIELDS: DocField[] = [
  { name: 'identity_document', label: "Pièce d'identité (CNI, passeport)", required: true },
  { name: 'siret_document', label: 'Justificatif auto-entrepreneur (SIREN/SIRET)', required: true, hint: "Attestation URSSAF, extrait KBIS ou certificat d'inscription auto-entrepreneur" },
  { name: 'rib_iban', label: 'RIB / IBAN', required: true },
  { name: 'criminal_record', label: 'Casier judiciaire (facultatif)', required: false },
  { name: 'certification_nova', label: 'Agrément NOVA (optionnel)', required: false, hint: "Requis uniquement si vous souhaitez bénéficier de l'avance immédiate URSSAF" },
  { name: 'rc_pro', label: 'Assurance RC Pro (optionnel)', required: false },
  { name: 'certifications', label: 'Certifications (optionnel)', required: false, hint: 'Diplômes, formations, certificats professionnels...' },
];

export function SignupDocumentsCard({ control }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents obligatoires
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Documents obligatoires pour traiter votre candidature
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOC_FIELDS.map(({ name, label, required, hint }) => (
          <FormField
            key={name}
            control={control}
            name={name}
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {label}{required ? ' *' : ''}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => onChange(e.target.files?.[0])}
                  />
                </FormControl>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Formats acceptés
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, PDF - Taille maximale: 10 MB par fichier
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
