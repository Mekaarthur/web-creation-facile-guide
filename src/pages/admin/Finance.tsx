import { AdminLayout } from "@/components/admin/layout/AdminLayout";

const AdminFinance = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Vue d'ensemble financière et comptabilité</p>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Module financier en cours de développement</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;