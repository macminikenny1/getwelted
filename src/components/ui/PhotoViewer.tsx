'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { imageSrc } from '@/lib/imageSrc';

interface PhotoViewerProps {
  open: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function PhotoViewer({ open, images, initialIndex = 0, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when opening with a new initialIndex
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, goNext, goPrev]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || images.length === 0) return null;

  const currentUrl = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Zoom hint */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1.5 text-white/60 text-xs pointer-events-none">
        <ZoomIn size={14} />
        <span>Pinch or scroll to zoom</span>
      </div>

      {/* Previous arrow */}
      {images.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Zoomable image */}
      <TransformWrapper
        key={currentIndex}
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit
        doubleClick={{ mode: 'toggle', step: 2 }}
        wheel={{ step: 0.3 }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(currentUrl)}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
