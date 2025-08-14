import { AdminAlertsPanel } from '@/components/AdminAlertsPanel';

export default function AdminAlertes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centre d'alertes</h1>
        <p className="text-muted-foreground">Situations nécessitant votre attention immédiate</p>
      </div>
      
      <AdminAlertsPanel />
    </div>
  );
}