'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Users, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PostCard from '@/components/posts/PostCard';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import type { Post, Profile } from '@/types';

function FeedSidebar() {
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ posts: 0, users: 0, listings: 0 });

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      // Fetch active users (most recent posters)
      const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentProfiles) setTopUsers(recentProfiles as Profile[]);

      // Quick stats
      const [postsRes, usersRes, listingsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bst_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setStats({
        posts: postsRes.count ?? 0,
        users: usersRes.count ?? 0,
        listings: listingsRes.count ?? 0,
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      {/* Community Stats */}
      <div className="bg-welted-card rounded-xl border border-welted-border p-5">
        <h3 className="text-sm font-bold text-welted-text mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-welted-accent" />
          Community
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-welted-accent">{stats.posts}</p>
            <p className="text-[11px] text-welted-text-muted">Posts</p>
          </div>
          <div>
            <p className="text-xl font-bold text-welted-accent">{stats.users}</p>
            <p className="text-[11px] text-welted-text-muted">Members</p>
          </div>
          <div>
            <p className="text-xl font-bold text-welted-accent">{stats.listings}</p>
            <p className="text-[11px] text-welted-text-muted">For Sale</p>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      {topUsers.length > 0 && (
        <div className="bg-welted-card rounded-xl border border-welted-border p-5">
          <h3 className="text-sm font-bold text-welted-text mb-4 flex items-center gap-2">
            <Users size={16} className="text-welted-accent" />
            Recent Members
          </h3>
          <div className="space-y-3">
            {topUsers.map(u => (
              <Link
                key={u.id}
                href={`/user/${u.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar url={u.avatar_url} name={u.username} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-welted-text truncate group-hover:text-welted-accent transition-colors">
                    {u.display_name || u.username}
                  </p>
                  <p className="text-[11px] text-welted-text-muted">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-welted-card rounded-xl border border-welted-border p-5">
        <h3 className="text-sm font-bold text-welted-text mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-welted-accent" />
          Explore
        </h3>
        <div className="space-y-2">
          <Link href="/brands" className="block text-sm text-welted-text-muted hover:text-welted-accent transition-colors py-1">
            Brand Database
          </Link>
          <Link href="/bst" className="block text-sm text-welted-text-muted hover:text-welted-accent transition-colors py-1">
            Buy · Sell · Trade
          </Link>
          <Link href="/search" className="block text-sm text-welted-text-muted hover:text-welted-accent transition-colors py-1">
            Search Community
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    // Fetch blocked user ids
    let blockedIds: string[] = [];
    if (user) {
      const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
      if (blocks) blockedIds = blocks.map((b: any) => b.blocked_id);
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url), likes(user_id), comments(id)`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const enriched = data
        .filter((p: any) => !blockedIds.includes(p.user_id))
        .map((p: any) => ({
          ...p,
          liked_by_user: user ? (p.likes ?? []).some((l: any) => l.user_id === user.id) : false,
          like_count: (p.likes ?? []).length,
          comment_count: (p.comments ?? []).length,
        }));
      setPosts(enriched as Post[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    const supabase = createClient();

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nowLiked = !p.liked_by_user;
      return { ...p, liked_by_user: nowLiked, like_count: (p.like_count ?? 0) + (nowLiked ? 1 : -1) };
    }));

    const { data: existing } = await supabase.from('likes').select('post_id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle();
    if (existing) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId });
      // Notify post owner
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'like',
          actor_id: currentUserId,
          target_id: postId,
          target_type: 'post',
          body: 'liked your post',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex gap-8">
      {/* Main feed column */}
      <div className="flex-1 max-w-2xl min-w-0">
        {posts.length === 0 ? (
          <div className="text-center py-20 px-8">
            <p className="text-6xl mb-4">👢</p>
            <h2 className="text-xl font-bold text-welted-text mb-2">Welcome to Welted</h2>
            <p className="text-welted-text-muted text-sm mb-8">
              Follow boot lovers to see their patina posts here. Or share your first pair to get started.
            </p>
            <Link
              href="/collection/new"
              className="inline-block bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Add Your First Pair
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-welted-border">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop right sidebar */}
      <aside className="hidden xl:block w-80 shrink-0 sticky top-16 self-start pt-4">
        <FeedSidebar />
      </aside>

      {/* FAB */}
      <Link
        href="/post/new"
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-welted-accent hover:bg-welted-accent-dim rounded-full flex items-center justify-center shadow-lg shadow-welted-accent/30 transition-colors z-40"
      >
        <Plus size={28} className="text-welted-bg" />
      </Link>
    </div>
  );
}
