import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  label: string;
  documentType: 'identity' | 'diploma' | 'insurance' | 'photo';
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  accept?: string;
  multiple?: boolean;
}

export const DocumentUpload = ({ 
  label, 
  documentType, 
  onUploadComplete, 
  currentUrl,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = false
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      // Simulation du progrès d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('provider-documents')
        .getPublicUrl(fileName);

      onUploadComplete(data.publicUrl);

      toast({
        title: "Document uploadé",
        description: "Le document a été téléchargé avec succès",
      });

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier ne doit pas dépasser 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`upload-${documentType}`}>{label}</Label>
      
      {currentUrl ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Document téléchargé</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(currentUrl, '_blank')}
            >
              <File className="w-4 h-4 mr-1" />
              Voir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUploadComplete('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <Label 
                htmlFor={`upload-${documentType}`}
                className="cursor-pointer text-primary hover:text-primary/80"
              >
                Cliquer pour télécharger
              </Label>
              <Input
                id={`upload-${documentType}`}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                multiple={multiple}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG (max. 5MB)
            </p>
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-gray-500">
                Upload en cours... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};