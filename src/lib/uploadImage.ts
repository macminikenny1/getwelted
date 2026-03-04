import { createClient } from '@/lib/supabase/client';

type Bucket = 'post-images' | 'avatars' | 'bst-images';

export async function uploadImage(
  file: File,
  bucket: Bucket,
  userId: string
): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

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
