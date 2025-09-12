import { AdminLayout } from "@/components/admin/layout/AdminLayout";

const AdminBrand = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion de marque</h1>
          <p className="text-muted-foreground">Configuration de l'identité visuelle et communications</p>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Interface de gestion de marque en cours de développement</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBrand;