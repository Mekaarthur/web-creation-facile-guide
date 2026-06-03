import { Button } from '@/components/ui/button';
import { Shield, Download } from 'lucide-react';

interface AdminRolesHeaderProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  onExport: () => void;
}

export const AdminRolesHeader = ({ showHistory, onToggleHistory, onExport }: AdminRolesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Gestion des Rôles Admin
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les droits d'administration de votre équipe
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onToggleHistory} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          {showHistory ? 'Vue Utilisateurs' : 'Historique'}
        </Button>
        <Button onClick={onExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>
    </div>
  );
};
