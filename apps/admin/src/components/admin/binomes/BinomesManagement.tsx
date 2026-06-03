import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, UserX, Users, History, Shield, Search, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import BinomesActions from "./BinomesActions";
import { useBulkActions } from "@/hooks/useBulkActions";
import { ExcelExportButton } from "@/components/admin/ExcelExportButton";

const binomesActifs = [
  {
    id: 1,
    client: "Marie Dubois",
    prestataire: "Sophie Martin",
    dateCreation: "2023-05-15",
    missions: 15,
    backup: "Julie Bernard",
    incidents: 0,
    notes: "Excellente relation, très satisfaits mutuellement"
  },
  {
    id: 2,
    client: "Pierre Lefebvre", 
    prestataire: "Julie Bernard",
    dateCreation: "2023-09-10",
    missions: 8,
    backup: "Claire Rousseau",
    incidents: 1,
    notes: "Relation stable, petit incident résolu rapidement"
  }
];

export const BinomesManagement = () => {
  const [selectedBinome, setSelectedBinome] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    executeBulkAction,
    isProcessing,
    ConfirmationDialog,
  } = useBulkActions();

  const binomeIds = binomesActifs.map(b => b.id.toString());

  const handleBulkDelete = async (ids: string[]) => {
    // Simulation de suppression
    toast({
      title: "Binômes supprimés",
      description: `${ids.length} binôme(s) ont été supprimés`,
    });
  };

  const handleBulkSuspend = async (ids: string[]) => {
    toast({
      title: "Binômes suspendus",
      description: `${ids.length} binôme(s) ont été suspendus`,
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmationDialog />
      
      {/* Actions principales */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Outils de Gestion</h2>
          <p className="text-muted-foreground">Créer, suivre et gérer les binômes</p>
        </div>
        
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearSelection()}
              >
                Désélectionner ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeBulkAction({
                  title: "Suspendre les binômes",
                  description: `Êtes-vous sûr de vouloir suspendre ${selectedIds.length} binôme(s) ?`,
                  confirmText: "Suspendre",
                  variant: "destructive",
                  onConfirm: handleBulkSuspend
                })}
                disabled={isProcessing}
              >
                Suspendre sélection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => executeBulkAction({
                  title: "Supprimer les binômes",
                  description: `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} binôme(s) ? Cette action est irréversible.`,
                  confirmText: "Supprimer",
                  variant: "destructive",
                  onConfirm: handleBulkDelete
                })}
                disabled={isProcessing}
              >
                Supprimer sélection
              </Button>
            </>
          )}
          
          <ExcelExportButton
            data={binomesActifs}
            filename="binomes-bikawo"
            sheetName="Binômes"
            title="Binômes Clients-Prestataires"
            subtitle={`Généré le ${new Date().toLocaleDateString('fr-FR')}`}
          />
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer un Binôme
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assistant de Création de Binôme</DialogTitle>
              <DialogDescription>
                Suivez les étapes pour créer un nouveau binôme client-prestataire
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="client">1. Client</TabsTrigger>
                <TabsTrigger value="matching">2. Matching</TabsTrigger>
                <TabsTrigger value="confirmation">3. Confirmation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="client" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Client à assigner</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marie">Marie Dubois</SelectItem>
                        <SelectItem value="pierre">Pierre Lefebvre</SelectItem>
                        <SelectItem value="anne">Anne Moreau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Services requis</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Type de service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kids">Bika Kids</SelectItem>
                        <SelectItem value="maison">Bika Maison</SelectItem>
                        <SelectItem value="seniors">Bika Seniors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Préférences spéciales</Label>
                    <Textarea placeholder="Notes particulières du client..." />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="matching" className="space-y-4">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Recherche en cours...</h3>
                  <p className="text-muted-foreground">
                    L'algorithme de matching analyse les prestataires disponibles
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="confirmation" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center py-4 border rounded-lg bg-green-50">
                    <h3 className="font-medium text-green-800">Binôme Proposé</h3>
                    <p className="text-green-600">Marie Dubois ↔ Sophie Martin</p>
                    <Badge className="bg-green-100 text-green-800 border-green-200 mt-2">
                      Compatibilité: 95%
                    </Badge>
                  </div>
                  
                  <div>
                    <Label>Prestataire de backup</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un backup" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="julie">Julie Bernard</SelectItem>
                        <SelectItem value="claire">Claire Rousseau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>
                      <Users className="h-4 w-4 mr-2" />
                      Créer le Binôme
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Liste des binômes avec outils */}
      <Card>
        <CardHeader>
          <CardTitle>Binômes Actifs</CardTitle>
          <CardDescription>
            Gérez les relations existantes et leurs paramètres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {binomesActifs.map((binome) => (
              <div key={binome.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{binome.client} ↔ {binome.prestataire}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Créé le {new Date(binome.dateCreation).toLocaleDateString()}</span>
                      <span>{binome.missions} missions</span>
                      <span>Backup: {binome.backup}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {binome.incidents > 0 && (
                      <Badge variant="destructive">{binome.incidents} incident(s)</Badge>
                    )}
                    <Badge variant="secondary">{binome.missions} missions</Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{binome.notes}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Historique",
                      description: `Affichage de l'historique du binôme ${binome.client} - ${binome.prestataire}`,
                    })}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Historique
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Modification",
                      description: `Ouverture de l'interface de modification pour ${binome.client}`,
                    })}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Changement de backup",
                      description: `Modification du prestataire de backup pour ${binome.client}`,
                    })}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Changer Backup
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => toast({
                      title: "Dissolution du binôme",
                      description: `Confirmation de dissolution du binôme ${binome.client} - ${binome.prestataire}`,
                      variant: "destructive",
                    })}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Dissoudre
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Procédure de changement */}
      <Card>
        <CardHeader>
          <CardTitle>Procédure de Changement Encadrée</CardTitle>
          <CardDescription>
            Workflow pour les changements de prestataire avec raisons documentées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h3 className="font-medium mb-1">Demande & Raison</h3>
              <p className="text-sm text-muted-foreground">
                Client ou prestataire exprime le besoin de changement
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h3 className="font-medium mb-1">Médiation</h3>
              <p className="text-sm text-muted-foreground">
                Tentative de résolution avec support admin
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h3 className="font-medium mb-1">Nouveau Matching</h3>
              <p className="text-sm text-muted-foreground">
                Recherche d'un nouveau partenaire si nécessaire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};