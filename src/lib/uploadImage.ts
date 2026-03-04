import { createClient } from '@/lib/supabase/client';

type Bucket = 'post-images' | 'avatars' | 'bst-images';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
    return 'Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image too large. Maximum size is 15 MB.';
  }
  return null;
}

/**
 * Detect if a file is HEIC/HEIF (iPhone camera format).
 * Checks both MIME type and file extension since iPhones
 * sometimes report the wrong MIME type.
 */
function isHeicFile(file: File): boolean {
  if (/heic|heif/i.test(file.type)) return true;
  if (/\.(heic|heif)$/i.test(file.name)) return true;
  return false;
}

/**
 * Convert a HEIC/HEIF file to JPEG in the browser.
 * Uses dynamic import so the ~800KB heic2any library is only
 * loaded when actually needed (code-split).
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  const heic2any = (await import('heic2any')).default;
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([resultBlob], newName, { type: 'image/jpeg' });
}

export async function uploadImage(
  file: File,
  bucket: Bucket,
  userId: string
): Promise<string | null> {
  const validationError = validateImage(file);
  if (validationError) {
    console.error('Upload validation error:', validationError);
    return null;
  }

  // Convert HEIC → JPEG before uploading so images are browser-friendly
  // and don't need server-side conversion on every view.
  let processedFile = file;
  try {
    processedFile = await convertHeicToJpeg(file);
  } catch (err) {
    console.warn('HEIC conversion failed, uploading original:', err);
    // Fall through — upload the original file. The image proxy
    // can still convert it on the read path as a fallback.
  }

  const supabase = createClient();
  const ext = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage.from(bucket).upload(path, processedFile, {
    contentType: processedFile.type || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImages(
  files: File[],
  bucket: Bucket,
  userId: string
): Promise<string[]> {
  const results = await Promise.all(
    files.map(file => uploadImage(file, bucket, userId))
  );
  return results.filter((url): url is string => url !== null);
}
