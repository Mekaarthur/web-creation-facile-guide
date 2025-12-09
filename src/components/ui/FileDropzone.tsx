import { useState, useCallback, DragEvent } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
}

export const FileDropzone = ({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSize = 10,
  className,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (fileList: FileList | File[]) => {
      const validFiles: File[] = [];
      const maxBytes = maxSize * 1024 * 1024;

      Array.from(fileList).forEach((file) => {
        if (file.size > maxBytes) {
          setError(`${file.name} dépasse ${maxSize}MB`);
          return;
        }
        validFiles.push(file);
      });

      return validFiles;
    },
    [maxSize]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        const newFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [files, multiple, onFilesSelected, validateFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (e.target.files) {
        const validFiles = validateFiles(e.target.files);
        if (validFiles.length > 0) {
          const newFiles = multiple ? [...files, ...validFiles] : validFiles;
          setFiles(newFiles);
          onFilesSelected(newFiles);
        }
      }
    },
    [files, multiple, onFilesSelected, validateFiles]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          id="file-dropzone"
        />
        <label htmlFor="file-dropzone" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Cliquez pour sélectionner</span>
            {' '}ou glissez vos fichiers ici
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxSize}MB par fichier
          </p>
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
