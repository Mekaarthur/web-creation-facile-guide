import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import ApplicationsKanban from '@/components/admin/ApplicationsKanban';
import { UnifiedProviderPipeline } from '@/components/admin/UnifiedProviderPipeline';

export default function ProviderManagement() {
  const [viewMode, setViewMode] = useState<'pipeline' | 'kanban'>('pipeline');

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestion Prestataires
          </h1>
          <p className="text-muted-foreground">
            Pipeline unifié : candidature → documents → onboarding → activation
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pipeline')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? <ApplicationsKanban /> : <UnifiedProviderPipeline />}
    </div>
  );
}
