import { ComplaintsPanel } from "@/components/admin/ComplaintsPanel";

const Reclamations = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Réclamations</h1>
          <p className="text-muted-foreground">
            Suivi et résolution des réclamations clients
          </p>
        </div>
        <ComplaintsPanel />
      </div>
    </div>
  );
};

export default Reclamations;
