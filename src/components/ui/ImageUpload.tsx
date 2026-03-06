'use client';

import { useRef, useState } from 'react';
import { Camera, X, Plus, Crop } from 'lucide-react';
import Image from 'next/image';
import CropModal from '@/components/ui/CropModal';

interface ImageUploadProps {
  images: File[];
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onReplace?: (index: number, file: File, preview: string) => void;
  maxImages?: number;
  single?: boolean;
  enableCrop?: boolean;
  defaultAspectRatio?: number;
}

export default function ImageUpload({
  images, previews, onAdd, onRemove, onReplace,
  maxImages = 10, single = false, enableCrop = true, defaultAspectRatio = 1,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAdd(files.slice(0, maxImages - images.length));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCropComplete = (croppedFile: File) => {
    if (cropIndex === null || !onReplace) return;
    const newPreview = URL.createObjectURL(croppedFile);
    onReplace(cropIndex, croppedFile, newPreview);
    setCropIndex(null);
  };

  const canAdd = images.length < maxImages;
  const showCrop = enableCrop && onReplace;

  if (single) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        {previews.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-square rounded-xl border-2 border-dashed border-welted-border hover:border-welted-accent/50 flex flex-col items-center justify-center gap-3 transition-colors"
          >
            <Camera size={32} className="text-welted-text-muted" />
            <span className="text-welted-text-muted text-sm font-medium">Add Photo</span>
          </button>
        ) : (
          <div className="relative w-full aspect-square rounded-xl overflow-hidden">
            <Image src={previews[0]} alt="Preview" fill className="object-cover" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              {showCrop && (
                <button
                  type="button"
                  onClick={() => setCropIndex(0)}
                  className="bg-black/60 rounded-full p-1.5 hover:bg-black/80 transition-colors"
                >
                  <Crop size={16} className="text-white" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(0)}
                className="bg-black/60 rounded-full p-1.5 hover:bg-black/80 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Crop Modal for single image */}
        {showCrop && cropIndex !== null && previews[cropIndex] && (
          <CropModal
            open={true}
            imageSrc={previews[cropIndex]}
            aspectRatio={defaultAspectRatio}
            onCrop={handleCropComplete}
            onCancel={() => setCropIndex(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {previews.map((src, i) => (
          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <div className="absolute top-1 right-1 flex gap-1">
              {showCrop && (
                <button
                  type="button"
                  onClick={() => setCropIndex(i)}
                  className="bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <Crop size={10} className="text-white" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-welted-border hover:border-welted-accent/50 flex items-center justify-center shrink-0 transition-colors"
          >
            <Plus size={24} className="text-welted-text-muted" />
          </button>
        )}
      </div>
      <p className="text-welted-text-muted text-xs mt-2">{images.length}/{maxImages} photos</p>

      {/* Crop Modal */}
      {showCrop && cropIndex !== null && previews[cropIndex] && (
        <CropModal
          open={true}
          imageSrc={previews[cropIndex]}
          aspectRatio={defaultAspectRatio}
          onCrop={handleCropComplete}
          onCancel={() => setCropIndex(null)}
        />
      )}
    </div>
  );
}
