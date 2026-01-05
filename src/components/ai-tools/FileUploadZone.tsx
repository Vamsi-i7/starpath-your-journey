import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileContent: (content: string, fileName: string) => void;
  isProcessing: boolean;
  accept?: string;
}

export function FileUploadZone({ onFileContent, isProcessing, accept = ".pdf,.png,.jpg,.jpeg,.webp" }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setError(null);
    setUploadedFile(file);
    setExtracting(true);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type;
      
      // Pass the base64 content to parent
      onFileContent(JSON.stringify({ base64, mimeType, fileName: file.name }), file.name);
    } catch (err) {
      setError('Failed to process file. Please try again.');
      console.error('File processing error:', err);
    } finally {
      setExtracting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-primary" />;
    }
    return <FileText className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop a PDF or image, or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, PNG, JPG, JPEG, WEBP
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          {extracting ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            getFileIcon(uploadedFile)
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {extracting ? 'Processing...' : 'Ready to analyze'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
