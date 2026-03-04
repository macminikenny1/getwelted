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

  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'image/jpeg',
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
