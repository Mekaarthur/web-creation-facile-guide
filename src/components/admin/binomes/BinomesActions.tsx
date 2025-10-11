import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserX,
  History,
  Shield,
  Edit,
  Search,
  MessageCircle,
  GraduationCap,
  Handshake,
  RotateCcw,
  CheckCircle,
  Phone,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface Binome {
  id: number;
  client: string;
  prestataire: string;
  backup: string;
  missions: number;
  status: string;
  incidents: number;
  notes: string;
}

interface BinomesActionsProps {
  binome: Binome;
  onUpdate: (binomeId: number, updates: Partial<Binome>) => void;
}

export const BinomesActions: React.FC<BinomesActionsProps> = ({ binome, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [mediationNotes, setMediationNotes] = useState('');
  const { toast } = useToast();

  const lancerMatching = async () => {
    setIsMatching(true);
    toast({
      title: "Matching lancé",
      description: "Recherche de prestataires compatibles en cours...",
    });
    
    // Simulation du matching
    setTimeout(() => {
      setIsMatching(false);
      toast({
        title: "Matching terminé",
        description: `3 prestataires compatibles trouvés pour ${binome.client}`,
      });
    }, 3000);
  };

  const analyserBinome = async () => {
    setIsAnalyzing(true);
    toast({
      title: "Analyse en cours",
      description: "Analyse des performances du binôme...",
    });

    try {
      const { data, error } = await supabase.rpc('analyze_binome_performance', {
        p_binome_id: binome.id.toString()
      });

      if (error) throw error;

      const result = data as any;

      setIsAnalyzing(false);
      toast({
        title: "Analyse terminée",
        description: `Score: ${result.compatibility_score}% | Succès: ${result.success_rate}% | Note: ${result.average_rating}/5`,
      });
    } catch (error: any) {
      setIsAnalyzing(false);
      console.error('Erreur analyse binôme:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'analyse",
        variant: "destructive"
      });
    }
  };

  const creerBinome = () => {
    toast({
      title: "Création de binôme",
      description: "Fonctionnalité disponible depuis l'onglet principal Binômes",
    });
    // Utiliser la fonction RPC create_binome() avec les IDs appropriés
  };

  const changerBackup = async (nouveauBackup: string) => {
    try {
      const { error } = await supabase.rpc('change_backup_provider', {
        p_binome_id: binome.id.toString(),
        p_new_backup_provider_id: nouveauBackup
      });

      if (error) throw error;

      onUpdate(binome.id, { backup: nouveauBackup });
      toast({
        title: "Backup modifié",
        description: `Nouveau prestataire de backup assigné avec succès`,
      });
    } catch (error: any) {
      console.error('Erreur changement backup:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du changement",
        variant: "destructive"
      });
    }
  };

  const voirHistorique = async () => {
    try {
      const { data, error } = await supabase.rpc('get_binome_history', {
        p_binome_id: binome.id.toString()
      });

      if (error) throw error;

      console.log('Historique du binôme:', data);
      toast({
        title: "Historique",
        description: `${(data as any)?.length || 0} actions enregistrées pour ce binôme`,
      });
      // TODO: Afficher dans un dialog ou une modale
    } catch (error: any) {
      console.error('Erreur historique:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la récupération",
        variant: "destructive"
      });
    }
  };

  const dissoudreBinome = async () => {
    const reason = window.prompt("Raison de la dissolution du binôme:");
    if (!reason) return;

    try {
      const { error } = await supabase.rpc('dissolve_binome', {
        p_binome_id: binome.id.toString(),
        p_reason: reason
      });

      if (error) throw error;

      onUpdate(binome.id, { status: 'dissous' });
      toast({
        title: "Dissolution confirmée",
        description: `Le binôme ${binome.client} - ${binome.prestataire} a été dissous`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error('Erreur dissolution:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la dissolution",
        variant: "destructive"
      });
    }
  };

  const recruterBackup = async () => {
    try {
      const { error } = await supabase.rpc('recruit_backup_provider', {
        p_binome_id: binome.id.toString()
      });

      if (error) throw error;

      toast({
        title: "Recrutement backup",
        description: "Processus lancé - Admins notifiés",
      });
    } catch (error: any) {
      console.error('Erreur recrutement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du recrutement",
        variant: "destructive"
      });
    }
  };

  const marquerTraite = async () => {
    try {
      const { error } = await supabase.rpc('mark_binome_resolved', {
        p_binome_id: binome.id.toString(),
        p_resolution_notes: "Marqué comme résolu par admin"
      });

      if (error) throw error;

      onUpdate(binome.id, { status: 'traite' });
      toast({
        title: "Binôme traité",
        description: "Le binôme a été marqué comme traité",
      });
    } catch (error: any) {
      console.error('Erreur marquage:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du marquage",
        variant: "destructive"
      });
    }
  };

  const redistribuer = async () => {
    try {
      const { data, error } = await supabase.rpc('redistribute_binome_missions', {
        p_binome_id: binome.id.toString()
      });

      if (error) throw error;

      toast({
        title: "Redistribution réussie",
        description: `${data || 0} missions redistribuées au prestataire backup`,
      });
    } catch (error: any) {
      console.error('Erreur redistribution:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la redistribution",
        variant: "destructive"
      });
    }
  };

  const contactCommercial = () => {
    toast({
      title: "Contact commercial",
      description: `Ouverture du contact commercial pour ${binome.client}`,
    });
  };

  const formationPrestataire = () => {
    toast({
      title: "Formation prestataire",
      description: `Module de formation assigné à ${binome.prestataire}`,
    });
  };

  const lancerMediation = async () => {
    const reason = window.prompt("Raison de la médiation:");
    if (!reason) return;

    try {
      const { data, error } = await supabase.rpc('initiate_mediation', {
        p_binome_id: binome.id.toString(),
        p_reason: reason,
        p_priority: 'medium'
      });

      if (error) throw error;

      toast({
        title: "Médiation initiée",
        description: `Processus de médiation lancé (ID: ${data})`,
      });
    } catch (error: any) {
      console.error('Erreur médiation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la médiation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Actions Principales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={lancerMatching}
              disabled={isMatching}
              size="sm"
            >
              {isMatching ? (
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Lancer Matching
            </Button>

            <Button 
              onClick={analyserBinome}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Analyser
            </Button>

            <Button onClick={creerBinome} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Créer Binôme
            </Button>

            <Button onClick={voirHistorique} variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions de gestion */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion du Binôme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Changer Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le Prestataire de Backup</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un nouveau prestataire de backup pour {binome.client}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select onValueChange={changerBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un nouveau backup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="julie">Julie Bernard</SelectItem>
                      <SelectItem value="claire">Claire Rousseau</SelectItem>
                      <SelectItem value="emma">Emma Leroy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={recruterBackup} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Recruter Backup
            </Button>

            <Button onClick={marquerTraite} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer Traité
            </Button>

            <Button onClick={redistribuer} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Redistribuer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions de support */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Formation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={contactCommercial} variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Contact Commercial
            </Button>

            <Button onClick={formationPrestataire} variant="outline" size="sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              Formation Prestataire
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Handshake className="h-4 w-4 mr-2" />
                  Médiation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Processus de Médiation</DialogTitle>
                  <DialogDescription>
                    Initier une médiation entre {binome.client} et {binome.prestataire}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Décrivez le problème et les actions à prendre..."
                    value={mediationNotes}
                    onChange={(e) => setMediationNotes(e.target.value)}
                  />
                  <Button onClick={lancerMediation} className="w-full">
                    <Handshake className="h-4 w-4 mr-2" />
                    Lancer la Médiation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <UserX className="h-4 w-4 mr-2" />
                  Dissoudre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la Dissolution</DialogTitle>
                  <DialogDescription>
                    Cette action va dissoudre définitivement le binôme {binome.client} - {binome.prestataire}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Action irréversible</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      Le binôme sera définitivement dissous et les parties devront être réassignées.
                    </p>
                  </div>
                  
                  <Textarea
                    placeholder="Raison de la dissolution (obligatoire)..."
                    onChange={(e) => setMediationNotes(e.target.value)}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <DialogTrigger asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogTrigger>
                    <Button variant="destructive" onClick={dissoudreBinome}>
                      <UserX className="h-4 w-4 mr-2" />
                      Confirmer la Dissolution
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Informations du binôme */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Binôme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground">Client</h4>
              <p className="text-muted-foreground">{binome.client}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Prestataire Principal</h4>
              <p className="text-muted-foreground">{binome.prestataire}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Prestataire de Backup</h4>
              <p className="text-muted-foreground">{binome.backup}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Performance</h4>
              <div className="flex gap-2">
                <Badge>{binome.missions} missions</Badge>
                {binome.incidents > 0 && (
                  <Badge variant="destructive">{binome.incidents} incident(s)</Badge>
                )}
              </div>
            </div>
          </div>
          
          {binome.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium text-foreground mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{binome.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BinomesActions;