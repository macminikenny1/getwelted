'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';

interface SavedPost {
  id: string;
  post_id: string;
  posts: {
    id: string;
    image_url: string;
    caption: string | null;
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const supabase = createClient();
    supabase
      .from('saved_posts')
      .select('id, post_id, posts(id, image_url, caption)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBookmarks(data as unknown as SavedPost[]);
        setLoading(false);
      });
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-welted-text">Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark size={48} className="mx-auto text-welted-text-muted/30 mb-4" />
          <p className="text-welted-text-muted text-sm">
            No saved posts yet. Bookmark posts to find them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 rounded-lg overflow-hidden">
          {bookmarks.map(bm => (
            <Link key={bm.id} href={`/post/${bm.posts.id}`} className="relative aspect-square group">
              <Image
                src={imageSrc(bm.posts.image_url)}
                alt={bm.posts.caption || 'Saved post'}
                fill
                className="object-cover group-hover:opacity-80 transition-opacity"
                sizes="(max-width: 768px) 33vw, 200px"
              />
              <div className="absolute top-1.5 right-1.5">
                <Bookmark size={14} className="text-white drop-shadow-md fill-white" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
