'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imageSrc } from '@/lib/imageSrc';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import type { Post } from '@/types';

const REPORT_REASONS = ['Spam', 'Inappropriate', 'Counterfeit', 'Harassment', 'Other'];

interface PostCardProps {
  post: Post;
  onLike: () => void;
  currentUserId?: string | null;
  isModerator?: boolean;
  onDelete?: () => void;
  /** Mark as high-priority for above-the-fold loading (skips lazy load) */
  priority?: boolean;
}

export default function PostCard({ post, onLike, currentUserId, isModerator, onDelete, priority = false }: PostCardProps) {
  const { showToast } = useToast();
  const [liked, setLiked] = useState(post.liked_by_user ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwn = currentUserId === post.user_id;
  const canDelete = isOwn || isModerator;

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

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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

  const handleDelete = async () => {
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      showToast('Failed to delete post.', 'error');
    } else {
      showToast('Post deleted.');
      onDelete?.();
    }
  };

  const handleReport = async (reason: string) => {
    if (!currentUserId) return;
    const supabase = createClient();
    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      target_type: 'post',
      target_id: post.id,
      reason,
    });
    showToast('Reported. Thanks for keeping the community safe.');
    setReportOpen(false);
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
        <div className="ml-auto flex items-center gap-2">
          {post.brand && <Badge variant="accent">{post.brand}</Badge>}
          {post.model && <Badge variant="muted">{post.model}</Badge>}
          {/* More menu */}
          {currentUserId && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-full hover:bg-welted-card-hover transition-colors text-welted-text-muted hover:text-welted-text"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-welted-card border border-welted-border rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                  {canDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-welted-danger hover:bg-welted-card-hover transition-colors text-left"
                    >
                      <Trash2 size={15} />
                      Delete Post
                    </button>
                  )}
                  {!isOwn && (
                    <button
                      onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-welted-text-muted hover:bg-welted-card-hover hover:text-welted-text transition-colors text-left"
                    >
                      <Flag size={15} />
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-square bg-welted-bg overflow-hidden">
          {post.image_url ? (
            <Image
              src={imageSrc(post.image_url)}
              alt={post.caption || 'Boot post'}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              priority={priority}
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

      {/* Delete Confirmation */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Delete', onClick: handleDelete, variant: 'danger' },
        ]}
      />

      {/* Report Reason Picker */}
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report Post"
        description="Why are you reporting this post?"
        actions={[
          ...REPORT_REASONS.map(reason => ({
            label: reason,
            onClick: () => handleReport(reason),
            variant: 'cancel' as const,
          })),
        ]}
      />
    </article>
  );
}
