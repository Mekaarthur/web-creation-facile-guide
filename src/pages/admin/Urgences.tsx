import { EmergencyDashboard } from "@/components/admin/EmergencyDashboard";

const Urgences = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Urgences</h1>
          <p className="text-muted-foreground">
            Dashboard temps réel, pool backup et protocole d'escalade
          </p>
        </div>
        <EmergencyDashboard />
      </div>
    </div>
  );
};

export default Urgences;
