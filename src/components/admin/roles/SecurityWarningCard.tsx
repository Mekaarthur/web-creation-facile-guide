import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const SecurityWarningCard = () => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-4 w-4" />
          Avertissement de Sécurité
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-orange-700">
        <ul className="list-disc list-inside space-y-1">
          <li>Vous ne pouvez pas modifier votre propre rôle</li>
          <li>Vous ne pouvez pas révoquer le dernier administrateur</li>
          <li>Toutes les actions sont enregistrées dans les logs Supabase</li>
        </ul>
      </CardContent>
    </Card>
  );
};
