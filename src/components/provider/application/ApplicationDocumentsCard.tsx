import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { DocumentUpload } from '@/components/DocumentUpload';
import type { FormData } from './types';

interface Props {
  formData: FormData;
  onUpdate: (field: keyof FormData, value: any) => void;
}

export function ApplicationDocumentsCard({ formData, onUpdate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents justificatifs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentUpload
          label="Pièce d'identité *"
          documentType="identity"
          currentUrl={formData.identity_document_url}
          onUploadComplete={(url) => onUpdate('identity_document_url', url)}
        />
        <DocumentUpload
          label="Diplômes / Certifications"
          documentType="diploma"
          currentUrl={formData.diploma_urls[0] || ''}
          onUploadComplete={(url) => onUpdate('diploma_urls', [url])}
        />
        <DocumentUpload
          label="Assurance professionnelle (si applicable)"
          documentType="insurance"
          currentUrl={formData.insurance_document_url}
          onUploadComplete={(url) => onUpdate('insurance_document_url', url)}
        />
      </CardContent>
    </Card>
  );
}
