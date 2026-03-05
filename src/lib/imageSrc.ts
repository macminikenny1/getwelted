/**
 * Append a cache-bust version param to Supabase Storage image URLs.
 *
 * After the HEIC → JPEG migration, Vercel's image optimization cache may
 * still hold stale HEIC responses for certain images.  Adding `?v=<N>`
 * changes the cache key so `/_next/image` fetches the fresh JPEG.
 *
 * Bump IMAGE_CACHE_VERSION whenever you re-upload or bulk-migrate images.
 */
const IMAGE_CACHE_VERSION = 2;

export function imageSrc(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('supabase.co')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${IMAGE_CACHE_VERSION}`;
  }
  return url;
}
