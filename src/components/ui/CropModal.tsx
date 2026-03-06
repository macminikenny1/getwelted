'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, Check, RotateCw } from 'lucide-react';
import { getCroppedImage } from '@/lib/cropImage';
import Chip from '@/components/ui/Chip';

interface CropModalProps {
  open: boolean;
  imageSrc: string;
  aspectRatio?: number;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS = [
  { label: 'Square', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: 'Free', value: 0 },
] as const;

export default function CropModal({ open, imageSrc, aspectRatio = 1, onCrop, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState(aspectRatio);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedFile = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        `cropped_${Date.now()}.jpg`,
        rotation
      );
      onCrop(croppedFile);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80">
        <button onClick={onCancel} className="text-white hover:text-welted-text-muted transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <Chip
              key={opt.label}
              label={opt.label}
              selected={selectedAspect === opt.value}
              onClick={() => setSelectedAspect(opt.value)}
            />
          ))}
        </div>
        <button
          onClick={handleRotate}
          className="text-white hover:text-welted-accent transition-colors"
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={selectedAspect === 0 ? undefined : selectedAspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          classes={{
            containerClassName: 'bg-black',
            cropAreaClassName: 'border-welted-accent',
          }}
          style={{
            containerStyle: { background: '#0F0D0B' },
            cropAreaStyle: { borderColor: '#C8864A', borderWidth: 2 },
          }}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-black/80 shrink-0 space-y-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-welted-text-muted w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 bg-welted-border rounded-full appearance-none cursor-pointer accent-welted-accent"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-welted-border text-welted-text text-sm font-semibold hover:bg-welted-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 py-3 rounded-lg bg-welted-accent text-white text-sm font-semibold hover:bg-welted-accent-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              'Cropping...'
            ) : (
              <>
                <Check size={16} />
                Apply Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
