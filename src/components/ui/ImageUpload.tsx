'use client';

import { useRef, useState } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  images: File[];
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  maxImages?: number;
  single?: boolean;
}

export default function ImageUpload({ images, previews, onAdd, onRemove, maxImages = 10, single = false }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAdd(files.slice(0, maxImages - images.length));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const canAdd = images.length < maxImages;

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
            <button
              type="button"
              onClick={() => onRemove(0)}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 hover:bg-black/80 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
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
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>
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
    </div>
  );
}
