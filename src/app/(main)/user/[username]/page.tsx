'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, UserPlus, UserCheck, Grid3X3, Package, Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, Post, Pair } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { fetchReputation, type ReputationData } from '@/lib/reputation';
import { formatTimeAgo } from '@/lib/formatTime';

type Tab = 'posts' | 'collection' | 'feedback';

interface FeedbackItem {
  id: string;
  from_user_id: string;
  rating: 'positive' | 'neutral' | 'negative';
  comment: string | null;
  role: 'buyer' | 'seller';
  created_at: string;
  profiles?: Profile;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Pick<Post, 'id' | 'image_url'>[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [pairsCount, setPairsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    const targetId = profileData.id;

    const [postsRes, pairsCountRes, followersRes, followingRes, pairsRes, feedbackRes] = await Promise.all([
      supabase.from('posts').select('id, image_url').eq('user_id', targetId).order('created_at', { ascending: false }),
      supabase.from('pairs').select('id', { count: 'exact' }).eq('user_id', targetId),
      supabase.from('follows').select('follower_id', { count: 'exact' }).eq('following_id', targetId),
      supabase.from('follows').select('following_id', { count: 'exact' }).eq('follower_id', targetId),
      supabase.from('pairs').select('*').eq('user_id', targetId).eq('is_public', true).order('created_at', { ascending: false }),
      supabase.from('feedback').select('*, profiles:profiles!feedback_from_user_id_fkey(id, username, avatar_url, display_name)').eq('to_user_id', targetId).order('created_at', { ascending: false }),
    ]);

    if (postsRes.data) setPosts(postsRes.data);
    setPairsCount(pairsCountRes.count ?? 0);
    setFollowersCount(followersRes.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);
    if (pairsRes.data) setPairs(pairsRes.data);
    if (feedbackRes.data) setFeedback(feedbackRes.data as unknown as FeedbackItem[]);

    // Check if current user follows this profile
    if (user && user.id !== targetId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .single();
      setIsFollowing(!!followData);
    }

    const rep = await fetchReputation(targetId);
    setReputation(rep);

    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    const supabase = createClient();

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);

      // Send notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'follow',
        actor_id: user.id,
        body: 'started following you',
      });
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p className="text-welted-text-muted">User not found.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'posts', label: 'Posts', icon: <Grid3X3 size={16} /> },
    { id: 'collection', label: 'Collection', icon: <Package size={16} /> },
    { id: 'feedback', label: 'Feedback', icon: <Star size={16} /> },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-welted-text">@{profile.username}</h1>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center gap-3">
        <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size="xl" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-welted-text">
            {profile.display_name || profile.username}
          </h2>
          <p className="text-welted-text-muted text-sm">@{profile.username}</p>
        </div>
        {profile.bio && (
          <p className="text-welted-text text-sm text-center max-w-sm">{profile.bio}</p>
        )}
      </div>

      {/* Stats */}
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

      {/* Follow Button */}
      {!isOwnProfile && user && (
        <div className="flex justify-center">
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleFollowToggle}
            disabled={followLoading}
          >
            {isFollowing ? (
              <>
                <UserCheck size={16} className="mr-1.5" />
                Following
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-1.5" />
                Follow
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-welted-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-welted-accent text-welted-accent'
                : 'border-transparent text-welted-text-muted hover:text-welted-text'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-welted-text-muted text-sm">No posts yet.</div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 rounded-lg overflow-hidden">
              {posts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square">
                  <Image
                    src={imageSrc(post.image_url)}
                    alt="Post"
                    fill
                    className="object-cover hover:opacity-80 transition-opacity"
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'collection' && (
        <>
          {pairs.length === 0 ? (
            <div className="text-center py-12 text-welted-text-muted text-sm">No public pairs.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pairs.map(pair => (
                <div key={pair.id} className="bg-welted-card border border-welted-border rounded-xl overflow-hidden">
                  {pair.image_urls?.[0] && (
                    <div className="relative aspect-square">
                      <Image src={imageSrc(pair.image_urls[0])} alt={pair.model} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-welted-text truncate">{pair.brand}</p>
                    <p className="text-xs text-welted-text-muted truncate">{pair.model}</p>
                    {pair.leather_type && (
                      <p className="text-xs text-welted-text-muted truncate mt-0.5">{pair.leather_type}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {/* Reputation Summary */}
          {reputation && (
            <div className="bg-welted-card border border-welted-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-welted-text">Reputation</h3>
                <Badge variant={reputation.score >= 90 ? 'success' : reputation.score >= 70 ? 'accent' : 'danger'}>
                  {reputation.score}%
                </Badge>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-welted-success flex items-center gap-1">
                  <ThumbsUp size={12} /> {reputation.positive} positive
                </span>
                <span className="text-welted-text-muted flex items-center gap-1">
                  <Minus size={12} /> {reputation.neutral} neutral
                </span>
                <span className="text-welted-danger flex items-center gap-1">
                  <ThumbsDown size={12} /> {reputation.negative} negative
                </span>
              </div>
            </div>
          )}

          {/* Feedback List */}
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-welted-text-muted text-sm">No feedback yet.</div>
          ) : (
            <div className="space-y-3">
              {feedback.map(fb => (
                <div key={fb.id} className="bg-welted-card border border-welted-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      url={fb.profiles?.avatar_url}
                      name={fb.profiles?.username || '?'}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-welted-text">
                      {fb.profiles?.username || 'Unknown'}
                    </span>
                    <Badge
                      variant={fb.rating === 'positive' ? 'success' : fb.rating === 'negative' ? 'danger' : 'muted'}
                    >
                      {fb.rating}
                    </Badge>
                    <Badge variant="muted">{fb.role}</Badge>
                    <span className="text-xs text-welted-text-muted ml-auto">
                      {formatTimeAgo(fb.created_at)}
                    </span>
                  </div>
                  {fb.comment && (
                    <p className="text-sm text-welted-text-muted">{fb.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
