import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { GeographicZone, ZoneFormData } from "./types";

interface Props {
  isDialogOpen: boolean;
  setIsDialogOpen: (v: boolean) => void;
  editingZone: GeographicZone | null;
  formData: ZoneFormData;
  setFormData: (v: ZoneFormData) => void;
  handleSaveZone: () => void;
  onOpenNewZone: () => void;
}

export function ZoneFormDialog({
  isDialogOpen, setIsDialogOpen, editingZone, formData, setFormData, handleSaveZone, onOpenNewZone,
}: Props) {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNewZone}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingZone ? 'Modifier la zone' : 'Créer une nouvelle zone'}
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de la zone géographique
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_zone">Nom de la zone *</Label>
              <Input
                id="nom_zone"
                value={formData.nom_zone}
                onChange={(e) => setFormData({ ...formData, nom_zone: e.target.value })}
                placeholder="Ex: Île-de-France"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_zone">Type de zone *</Label>
              <Select
                value={formData.type_zone}
                onValueChange={(value) => setFormData({ ...formData, type_zone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="region">Région</SelectItem>
                  <SelectItem value="departement">Département</SelectItem>
                  <SelectItem value="metropole">Métropole</SelectItem>
                  <SelectItem value="ville">Ville</SelectItem>
                  <SelectItem value="secteur">Secteur personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="villes_couvertes">Villes couvertes (séparées par des virgules)</Label>
            <Input
              id="villes_couvertes"
              value={formData.villes_couvertes}
              onChange={(e) => setFormData({ ...formData, villes_couvertes: e.target.value })}
              placeholder="Paris, Boulogne-Billancourt, Nanterre..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codes_postaux">Codes postaux (séparés par des virgules) *</Label>
            <Input
              id="codes_postaux"
              value={formData.codes_postaux}
              onChange={(e) => setFormData({ ...formData, codes_postaux: e.target.value })}
              placeholder="75001, 75002, 92100..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rayon_km">Rayon en km (optionnel)</Label>
              <Input
                id="rayon_km"
                type="number"
                value={formData.rayon_km}
                onChange={(e) => setFormData({ ...formData, rayon_km: e.target.value })}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">✅ Active</SelectItem>
                  <SelectItem value="inactive">❌ Inactive</SelectItem>
                  <SelectItem value="test">🟡 En test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la zone..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveZone}>
              {editingZone ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
