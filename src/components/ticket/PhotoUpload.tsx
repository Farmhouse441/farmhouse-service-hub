import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  label: string;
  required?: boolean;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoUpload({ 
  label, 
  required = false, 
  photos, 
  onPhotosChange, 
  maxPhotos = 10,
  className 
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, maxPhotos);
    onPhotosChange(newPhotos);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        <span className="text-xs text-muted-foreground">
          ({photos.length}/{maxPhotos})
        </span>
      </div>

      {/* Upload button */}
      {canAddMore && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {required && photos.length === 0 && (
        <p className="text-sm text-destructive">At least one photo is required</p>
      )}
    </div>
  );
}