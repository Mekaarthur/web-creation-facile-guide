import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface BulkActionConfig {
  title: string;
  description: string;
  confirmText?: string;
  variant?: "default" | "destructive";
  onConfirm: (selectedIds: string[]) => Promise<void>;
}

export const useBulkActions = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkActionConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = (allIds: string[]) => {
    setSelectedIds(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const executeBulkAction = (config: BulkActionConfig) => {
    if (selectedIds.length === 0) return;
    setCurrentAction(config);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;
    
    setIsProcessing(true);
    try {
      await currentAction.onConfirm(selectedIds);
      clearSelection();
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
      setCurrentAction(null);
    }
  };

  const ConfirmationDialog = () => (
    currentAction ? (
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirm}
        title={currentAction.title}
        description={currentAction.description}
        confirmText={currentAction.confirmText}
        variant={currentAction.variant}
      />
    ) : null
  );

  return {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    executeBulkAction,
    isProcessing,
    ConfirmationDialog,
  };
};
