'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/lib/formatTime';
import type { Conversation, Profile, BSTListing } from '@/types';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { MessageSquare, Package } from 'lucide-react';

interface ConversationWithJoins extends Conversation {
  bst_listings: Pick<BSTListing, 'id' | 'brand' | 'model' | 'image_urls'> | null;
  buyer: Profile;
  seller: Profile;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithJoins[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select(
          '*, bst_listings(id, brand, model, image_urls), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url)'
        )
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Failed to load conversations:', error);
        setLoading(false);
        return;
      }

      setConversations((data ?? []) as ConversationWithJoins[]);
      setLoading(false);
    }

    load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <MessageSquare size={48} className="text-welted-text-muted mb-4" />
        <p className="text-welted-text font-semibold">Sign in to see your messages</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-welted-bg border-b border-welted-border px-4 py-3">
        <h1 className="text-xl font-bold text-welted-text">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <MessageSquare size={48} className="text-welted-text-muted mb-4" />
          <p className="text-welted-text font-semibold mb-1">No messages yet</p>
          <p className="text-welted-text-muted text-sm">
            When you message a seller or receive a message, it will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-welted-border">
          {conversations.map((convo) => {
            const otherUser =
              convo.buyer_id === user.id ? convo.seller : convo.buyer;
            const listingImage = convo.bst_listings?.image_urls?.[0];
            const listingLabel = convo.bst_listings
              ? `${convo.bst_listings.brand} ${convo.bst_listings.model}`
              : null;

            return (
              <button
                key={convo.id}
                onClick={() => router.push(`/messages/${convo.id}`)}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-welted-card transition-colors text-left"
              >
                {/* Listing thumbnail or avatar */}
                {listingImage ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-welted-input-bg">
                    <Image
                      src={listingImage}
                      alt={listingLabel || 'Listing'}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <Avatar
                    url={otherUser?.avatar_url}
                    name={otherUser?.username || '?'}
                    size="lg"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-welted-text truncate">
                      {otherUser?.username || 'Unknown'}
                    </p>
                    {convo.last_message_at && (
                      <span className="text-[11px] text-welted-text-muted shrink-0">
                        {formatTimeAgo(convo.last_message_at)}
                      </span>
                    )}
                  </div>
                  {listingLabel && (
                    <p className="text-xs text-welted-text-muted truncate">
                      {listingLabel}
                    </p>
                  )}
                  {convo.last_message && (
                    <p className="text-sm text-welted-text-muted truncate mt-0.5">
                      {convo.last_message}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
