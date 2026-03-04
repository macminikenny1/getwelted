'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { formatDate } from '@/lib/formatTime';
import type { Post, Comment } from '@/types';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const [postRes, commentsRes] = await Promise.all([
        supabase.from('posts').select('*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url)').eq('id', id).single(),
        supabase.from('comments').select('*, profiles(id, username, avatar_url)').eq('post_id', id).order('created_at', { ascending: true }),
      ]);

      if (postRes.data) setPost(postRes.data as Post);
      if (commentsRes.data) setComments(commentsRes.data as Comment[]);
      setLoading(false);
    };

    fetchAll();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || submitting) return;
    setSubmitting(true);
    const body = newComment.trim();
    setNewComment('');

    const supabase = createClient();
    const { data } = await supabase.from('comments').insert({
      post_id: id,
      user_id: currentUserId,
      body,
    }).select('*, profiles(id, username, avatar_url)').single();

    if (data) {
      setComments(prev => [...prev, data as Comment]);
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Notify post owner
    if (post && post.user_id !== currentUserId) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'comment',
        actor_id: currentUserId,
        target_id: id,
        target_type: 'post',
        body: `commented: "${body.slice(0, 50)}${body.length > 50 ? '...' : ''}"`,
      });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  if (!post) return <div className="text-center py-20 text-welted-text-muted">Post not found.</div>;

  const username = (post as any).profiles?.username ?? '';

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Post image */}
      <div className="relative w-full aspect-square bg-welted-bg">
        <Image src={post.image_url} alt={post.caption || 'Post'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
      </div>

      {/* Post meta */}
      <div className="p-4">
        <Link href={`/user/${username}`} className="flex items-center gap-3 mb-3">
          <Avatar url={(post as any).profiles?.avatar_url} name={username} size="md" />
          <span className="text-sm font-bold text-welted-accent">@{username}</span>
        </Link>
        {post.caption && <p className="text-welted-text text-[15px] leading-relaxed mb-2">{post.caption}</p>}
        <time className="text-xs text-welted-text-muted">{formatDate(post.created_at)}</time>
      </div>

      {/* Divider */}
      <div className="h-px bg-welted-border mx-4" />

      {/* Comments */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-welted-text-muted uppercase tracking-wider mb-4">
          {comments.length === 0 ? 'No comments yet' : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
        </p>

        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar url={(comment as any).profiles?.avatar_url} name={(comment as any).profiles?.username ?? '?'} size="sm" />
              <div>
                <Link href={`/user/${(comment as any).profiles?.username}`} className="text-sm font-bold text-welted-accent hover:underline">
                  @{(comment as any).profiles?.username ?? ''}
                </Link>
                <p className="text-sm text-welted-text leading-relaxed">{comment.body}</p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Comment input */}
      <div className="sticky bottom-0 bg-welted-bg border-t border-welted-border p-4 mt-auto">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            maxLength={300}
            className="flex-1 bg-welted-card border border-welted-border rounded-full px-4 py-2 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="bg-welted-accent hover:bg-welted-accent-dim text-welted-bg text-sm font-bold px-5 py-2 rounded-full transition-colors disabled:opacity-40"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
