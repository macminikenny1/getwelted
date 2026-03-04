import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * Custom image proxy that handles HEIC images (uploaded from iPhones)
 * by converting them to WebP/JPEG that browsers can display.
 *
 * Includes an in-memory LRU cache to avoid re-processing images on every request.
 *
 * Usage: /api/image?url=<encoded-image-url>&w=<width>&q=<quality>
 */

// ─── LRU Cache ───────────────────────────────────────────────────────────────
interface CacheEntry {
  buffer: Uint8Array;
  contentType: string;
  createdAt: number;
}

const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_BYTES = 200 * 1024 * 1024; // 200 MB
const TTL_MS = 60 * 60 * 1000; // 1 hour

// Map preserves insertion order — we use it as an LRU by re-inserting on access
const cache = new Map<string, CacheEntry>();
let cacheBytes = 0;

function cacheKey(url: string, width: number | undefined, quality: number): string {
  return `${url}|w=${width ?? 0}|q=${quality}`;
}

function cacheGet(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  // Expired?
  if (Date.now() - entry.createdAt > TTL_MS) {
    cacheBytes -= entry.buffer.byteLength;
    cache.delete(key);
    return undefined;
  }

  // Move to end (most recently used)
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cacheSet(key: string, entry: CacheEntry): void {
  // If already cached, remove old entry first
  const existing = cache.get(key);
  if (existing) {
    cacheBytes -= existing.buffer.byteLength;
    cache.delete(key);
  }

  // Evict oldest entries until we're under limits
  while (
    (cache.size >= MAX_CACHE_ENTRIES || cacheBytes + entry.buffer.byteLength > MAX_CACHE_BYTES) &&
    cache.size > 0
  ) {
    const oldest = cache.keys().next().value!;
    const oldEntry = cache.get(oldest)!;
    cacheBytes -= oldEntry.buffer.byteLength;
    cache.delete(oldest);
  }

  cache.set(key, entry);
  cacheBytes += entry.buffer.byteLength;
}

// ─── HEIC Detection ──────────────────────────────────────────────────────────
// HEIC magic bytes: offset 4-8 = "ftyp" followed by "heic", "heix", "mif1", etc.
function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12);
  return ['heic', 'heix', 'mif1', 'hevc', 'hevx'].includes(brand);
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');
  const width = parseInt(searchParams.get('w') || '0', 10) || undefined;
  const quality = parseInt(searchParams.get('q') || '80', 10);

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow proxying from trusted domains (exact match or subdomain)
  const allowed = ['supabase.co', 'unsplash.com'];
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS URLs allowed' }, { status: 403 });
    }
    const isAllowed = allowed.some((d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Check cache first
  const key = cacheKey(url, width, quality);
  const cached = cacheGet(key);
  if (cached) {
    return new NextResponse(Buffer.from(cached.buffer), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 },
      );
    }

    // Check Content-Length before downloading
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    let buffer = Buffer.from(arrayBuffer);

    // Check if the image is actually HEIC (iPhones upload HEIC with .jpg extension)
    if (isHeic(buffer)) {
      // Dynamically import heic-convert (pure JS HEIC decoder)
      const convert = (await import('heic-convert')).default;
      const jpegBuffer = await convert({
        buffer: new Uint8Array(buffer),
        format: 'JPEG',
        quality: 0.9,
      });
      buffer = Buffer.from(jpegBuffer);
    }

    // Use sharp for resizing and WebP conversion
    let pipeline = sharp(buffer);

    if (width) {
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }

    const webpBuffer = await pipeline.webp({ quality }).toBuffer();
    const resultBuffer = new Uint8Array(webpBuffer);
    const contentType = 'image/webp';

    // Store in cache
    cacheSet(key, {
      buffer: resultBuffer,
      contentType,
      createdAt: Date.now(),
    });

    return new NextResponse(Buffer.from(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
