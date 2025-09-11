import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Eye, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EnhancedFileUploadProps {
  bucketName: string;
  path: string;
  acceptedTypes?: string;
  maxSize?: number;
  onUploadComplete?: (url: string, fileName: string) => void;
  existingFileUrl?: string;
  title: string;
  description?: string;
  multiple?: boolean;
  disabled?: boolean;
}

interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  bucketName,
  path,
  acceptedTypes = "image/*,application/pdf,.doc,.docx",
  maxSize = 5 * 1024 * 1024, // 5MB
  onUploadComplete,
  existingFileUrl,
  title,
  description,
  multiple = false,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Le fichier ${file.name} dépasse la taille maximale de ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
    const isValidType = acceptedTypesArray.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'application/*') return file.type.startsWith('application/');
      if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
      return file.type === type;
    });

    if (!isValidType) {
      return `Type de fichier non autorisé pour ${file.name}`;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  const uploadFile = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const validation = validateFile(file);
    if (validation) {
      throw new Error(validation);
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${path}/${fileName}`;

    // Simuler le progrès de l'upload
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      return {
        url: data.publicUrl,
        name: file.name,
        size: file.size
      };
    } finally {
      clearInterval(progressInterval);
    }
  }, [bucketName, path, validateFile]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled) return;
    
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const filesToUpload = Array.from(files);
      
      if (!multiple && filesToUpload.length > 1) {
        throw new Error('Un seul fichier autorisé');
      }

      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);

      setUploadedFiles(prev => multiple ? [...prev, ...results] : results);
      
      results.forEach(result => {
        onUploadComplete?.(result.url, result.name);
        toast({
          title: "Upload réussi",
          description: `${result.name} a été uploadé avec succès`,
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      setError(errorMessage);
      toast({
        title: "Erreur d'upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [disabled, multiple, uploadFile, onUploadComplete, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(async (fileUrl: string) => {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.url !== fileUrl));
      toast({
        title: "Fichier supprimé",
        description: "Le fichier a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
    }
  }, [bucketName, toast]);

  const filesToDisplay = existingFileUrl && uploadedFiles.length === 0 
    ? [{ url: existingFileUrl, name: 'Fichier existant', size: 0 }]
    : uploadedFiles;

  if (filesToDisplay.length > 0 && !multiple) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">{title}</h3>
        {filesToDisplay.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                {file.size > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFile(file.url)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
          error ? "border-destructive" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          {uploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Upload en cours...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-déposez {multiple ? 'vos fichiers' : 'votre fichier'} ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: {acceptedTypes} • Taille max: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Affichage des fichiers multiples */}
      {multiple && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Fichiers uploadés:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.url);
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};