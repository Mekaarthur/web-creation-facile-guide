import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  bucketName: string;
  path: string;
  acceptedTypes?: string;
  maxSize?: number; // en MB
  onUploadComplete?: (url: string) => void;
  existingFileUrl?: string;
  title: string;
  description?: string;
}

const FileUpload = ({
  bucketName,
  path,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSize = 5,
  onUploadComplete,
  existingFileUrl,
  title,
  description
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Vérification de la taille
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `Le fichier ne doit pas dépasser ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      // Génération d'un nom unique pour le fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${path}/${Date.now()}.${fileExt}`;

      // Simulation du progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setTimeout(() => {
        toast({
          title: "Upload réussi",
          description: "Votre fichier a été téléchargé avec succès",
        });
        
        onUploadComplete?.(publicUrl);
        setUploadProgress(0);
        setUploading(false);
      }, 500);

    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur d'upload",
        description: error.message || "Une erreur est survenue lors du téléchargement",
        variant: "destructive",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = async () => {
    if (!existingFileUrl) return;

    try {
      // Extraire le chemin du fichier depuis l'URL
      const url = new URL(existingFileUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-3).join('/'); // user_id/path/filename

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });

      onUploadComplete?.("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {existingFileUrl ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Fichier téléchargé</p>
                <p className="text-xs text-muted-foreground">Cliquez pour voir ou remplacer</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(existingFileUrl, '_blank')}
              >
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Téléchargement en cours...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Glissez votre fichier ici ou{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline"
                    >
                      parcourez
                    </button>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formats acceptés: {acceptedTypes} • Max {maxSize}MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                >
                  <File className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;