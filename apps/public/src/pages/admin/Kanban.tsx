import { AdminKanbanBoard } from '@/components/AdminKanbanBoard';

export default function AdminKanban() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau Kanban</h1>
        <p className="text-muted-foreground">Vue visuelle des missions par statut</p>
      </div>
      
      <AdminKanbanBoard />
    </div>
  );
}