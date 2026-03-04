'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { Camera, Settings, LogOut, Bookmark, Heart, Shield, Grid3X3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, Post } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { uploadImage } from '@/lib/uploadImage';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Pick<Post, 'id' | 'image_url'>[]>([]);
  const [pairsCount, setPairsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const supabase = createClient();

    async function fetchData() {
      const userId = user!.id;

      const [profileRes, postsRes, pairsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('posts').select('id, image_url').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('pairs').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('follows').select('following_id', { count: 'exact' }).eq('follower_id', userId),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      setPairsCount(pairsRes.count ?? 0);
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const url = await uploadImage(file, 'avatars', user.id);
    if (url) {
      const supabase = createClient();
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
      showToast('Avatar updated');
    } else {
      showToast('Failed to upload avatar', 'error');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center text-welted-text-muted">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
          disabled={uploading}
        >
          <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploading ? <Spinner size="sm" /> : <Camera size={24} className="text-white" />}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />

        {/* Name & Username */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-welted-text">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-welted-text-muted text-sm">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-welted-text text-sm text-center max-w-sm">{profile.bio}</p>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex justify-center gap-8">
        {[
          { label: 'Pairs', value: pairsCount },
          { label: 'Posts', value: posts.length },
          { label: 'Followers', value: followersCount },
          { label: 'Following', value: followingCount },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold text-welted-text">{stat.value}</p>
            <p className="text-xs text-welted-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" size="sm" onClick={() => router.push('/profile/edit')}>
          <Settings size={16} className="mr-1.5" />
          Edit Profile
        </Button>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          <LogOut size={16} className="mr-1.5" />
          Sign Out
        </Button>
      </div>

      {/* Links */}
      <div className="space-y-1">
        <Link
          href="/bookmarks"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-welted-card transition-colors text-welted-text"
        >
          <Bookmark size={20} className="text-welted-text-muted" />
          <span className="text-sm font-medium">Bookmarks</span>
        </Link>
        <Link
          href="/wishlist"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-welted-card transition-colors text-welted-text"
        >
          <Heart size={20} className="text-welted-text-muted" />
          <span className="text-sm font-medium">Wish List</span>
        </Link>
        {profile.is_moderator && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-welted-card transition-colors text-welted-text"
          >
            <Shield size={20} className="text-welted-accent" />
            <span className="text-sm font-medium text-welted-accent">Mod Tools</span>
          </Link>
        )}
      </div>

      {/* Posts Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Grid3X3 size={16} className="text-welted-text-muted" />
          <h2 className="text-sm font-semibold text-welted-text-muted uppercase tracking-wide">Posts</h2>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-welted-text-muted text-sm">
            No posts yet. Share your first pair!
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 rounded-lg overflow-hidden">
            {posts.map(post => (
              <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square">
                <Image
                  src={post.image_url}
                  alt="Post"
                  fill
                  className="object-cover hover:opacity-80 transition-opacity"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
