'use client';

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader that routes all remote images through our
 * /api/image proxy. This handles HEIC → WebP conversion for Supabase
 * storage images (uploaded from iPhones) and also provides consistent
 * image optimization for all sources.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderParams): string {
  const q = quality || 75;

  // Route all remote images through our custom proxy
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
  }

  // Local/relative images pass through as-is
  return src;
}
