import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';
import { RoleTestPanel } from '@/components/RoleTestPanel';

const Security = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Sécurité & Rôles</h1>
        <p className="text-muted-foreground">
          Monitoring du système de sécurité, gestion des rôles et tests d'accès
        </p>
      </div>

      <SecurityMonitoring />

      <div className="mt-8">
        <RoleTestPanel />
      </div>
    </div>
  );
};

export default Security;