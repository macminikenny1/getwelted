'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  currentUserId?: string | null;
}

export default function PostCard({ post, onLike, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLiked(post.liked_by_user ?? false);
    setLikeCount(post.like_count ?? 0);
  }, [post.liked_by_user, post.like_count]);

  // Check saved status
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    supabase.from('saved_posts').select('post_id').eq('user_id', currentUserId).eq('post_id', post.id).maybeSingle().then(({ data }) => {
      setSaved(!!data);
    });
  }, [currentUserId, post.id]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike();
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    const supabase = createClient();
    if (saved) {
      await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', post.id);
    } else {
      await supabase.from('saved_posts').insert({ user_id: currentUserId, post_id: post.id });
    }
    setSaved(!saved);
  };

  const username = post.profiles?.username ?? 'bootlover';
  const commentCount = post.comment_count ?? 0;

  return (
    <article className="bg-welted-card border-b border-welted-border">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/user/${username}`} className="flex items-center gap-3 min-w-0">
          <Avatar url={post.profiles?.avatar_url} name={username} size="md" />
          <span className="text-sm font-semibold text-welted-text truncate">{username}</span>
        </Link>
        <div className="ml-auto flex gap-1.5">
          {post.brand && <Badge variant="accent">{post.brand}</Badge>}
          {post.model && <Badge variant="muted">{post.model}</Badge>}
        </div>
      </div>

      {/* Image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-square bg-welted-bg overflow-hidden">
          {post.image_url ? (
            <Image
              src={post.image_url}
              alt={post.caption || 'Boot post'}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              unoptimized={!post.image_url.includes('supabase.co') && !post.image_url.includes('unsplash.com')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-welted-text-muted text-4xl">👢</div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-5">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <Heart
                size={22}
                className={liked ? 'fill-welted-burgundy text-welted-burgundy' : 'text-welted-text group-hover:text-welted-burgundy-light transition-colors'}
              />
              <span className="text-sm text-welted-text-muted font-medium">{likeCount}</span>
            </button>
            <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 group">
              <MessageCircle size={22} className="text-welted-text group-hover:text-welted-accent transition-colors" />
              <span className="text-sm text-welted-text-muted font-medium">{commentCount}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="group">
              <Bookmark
                size={22}
                className={saved ? 'fill-welted-accent text-welted-accent' : 'text-welted-text group-hover:text-welted-accent transition-colors'}
              />
            </button>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-welted-text leading-relaxed mb-1">
            <Link href={`/user/${username}`} className="font-bold hover:underline">{username}</Link>{' '}
            {post.caption}
          </p>
        )}

        {/* Timestamp */}
        <time className="text-xs text-welted-text-muted">
          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </time>
      </div>
    </article>
  );
}
