import { AdminLayout } from "@/components/admin/layout/AdminLayout";

const AdminTools = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Outils</h1>
          <p className="text-muted-foreground">Utilitaires et outils d'administration</p>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Boîte à outils en cours de développement</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTools;