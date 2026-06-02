import { useState } from "react";
import { Star, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { ConfirmDialog } from "./ConfirmDialog";

interface FilterManagerProps {
  filterType: string;
  currentFilters: any;
  onApplyFilter: (config: any) => void;
}

export const FilterManager = ({ filterType, currentFilters, onApplyFilter }: FilterManagerProps) => {
  const { filters, saveFilter, deleteFilter, toggleFavorite } = useSavedFilters(filterType);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSave = () => {
    if (!filterName.trim()) return;
    
    saveFilter.mutate(
      { name: filterName, config: currentFilters },
      {
        onSuccess: () => {
          setSaveDialogOpen(false);
          setFilterName("");
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bouton pour sauvegarder le filtre actuel */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder le filtre
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder le filtre</DialogTitle>
            <DialogDescription>
              Donnez un nom à ce filtre pour le réutiliser plus tard
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nom du filtre..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim()}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dropdown des filtres sauvegardés */}
      {filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Filtres sauvegardés ({filters.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-background z-50">
            {filters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onApplyFilter(filter.filter_config)}
              >
                <span className="flex items-center gap-2">
                  {filter.is_favorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                  {filter.filter_name}
                </span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleFavorite.mutate({ 
                      filterId: filter.id, 
                      isFavorite: !filter.is_favorite 
                    })}
                  >
                    <Star className={`w-3 h-3 ${filter.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => setDeleteConfirm(filter.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteFilter.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
        title="Supprimer le filtre"
        description="Êtes-vous sûr de vouloir supprimer ce filtre ? Cette action est irréversible."
        variant="destructive"
        confirmText="Supprimer"
      />
    </div>
  );
};
