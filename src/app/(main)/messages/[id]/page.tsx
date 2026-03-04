'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/lib/formatTime';
import type { Message, Conversation, Profile, BSTListing } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Send, Package } from 'lucide-react';

interface ConversationDetail extends Conversation {
  bst_listings: Pick<BSTListing, 'id' | 'brand' | 'model' | 'image_urls'> | null;
  buyer: Profile;
  seller: Profile;
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversation and messages
  useEffect(() => {
    if (!user) return;

    async function load() {
      const supabase = createClient();

      // Load conversation
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .select(
          '*, bst_listings(id, brand, model, image_urls), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url)'
        )
        .eq('id', conversationId)
        .single();

      if (convoError || !convo) {
        console.error('Failed to load conversation:', convoError);
        setLoading(false);
        return;
      }

      setConversation(convo as ConversationDetail);

      // Load messages
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgsError) {
        console.error('Failed to load messages:', msgsError);
      } else {
        setMessages((msgs ?? []) as Message[]);
      }

      setLoading(false);
    }

    load();
  }, [conversationId, user]);

  // Mark as read on mount (update last read timestamp or similar)
  useEffect(() => {
    if (!user || !conversation) return;

    // We mark the conversation as read by updating notifications
    const supabase = createClient();
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('target_id', conversationId)
      .eq('type', 'message')
      .then(() => {});
  }, [user, conversation, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;

    const body = text.trim();
    setText('');
    setSending(true);

    const supabase = createClient();

    // Insert message
    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      })
      .select()
      .single();

    if (error) {
      showToast('Failed to send message', 'error');
      setText(body); // Restore text
      console.error(error);
    } else {
      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({
          last_message: body,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Optimistically add if not already added via real-time
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg as Message];
        });
      }
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!conversation || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-welted-text font-semibold">Conversation not found</p>
      </div>
    );
  }

  const otherUser =
    conversation.buyer_id === user.id
      ? conversation.seller
      : conversation.buyer;

  const listingImage = conversation.bst_listings?.image_urls?.[0];
  const listingLabel = conversation.bst_listings
    ? `${conversation.bst_listings.brand} ${conversation.bst_listings.model}`
    : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      {/* Header */}
      <div className="shrink-0 bg-welted-bg border-b border-welted-border px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.push('/messages')}
          className="text-welted-text-muted hover:text-welted-text transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar
          url={otherUser?.avatar_url}
          name={otherUser?.username || '?'}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-welted-text truncate">
            {otherUser?.username || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Listing Banner */}
      {conversation.bst_listings && (
        <Link
          href={`/bst/${conversation.bst_listings.id}`}
          className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-welted-card border-b border-welted-border hover:bg-welted-card-hover transition-colors"
        >
          {listingImage ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-welted-input-bg">
              <Image
                src={listingImage}
                alt={listingLabel || 'Listing'}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-welted-input-bg flex items-center justify-center shrink-0">
              <Package size={18} className="text-welted-text-muted" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-welted-text truncate">
              {listingLabel}
            </p>
            <p className="text-[11px] text-welted-text-muted">View listing</p>
          </div>
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-welted-text-muted text-sm">
              No messages yet. Say hello!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMine
                    ? 'bg-welted-accent text-welted-bg rounded-br-md'
                    : 'bg-welted-card border border-welted-border text-welted-text rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.body}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? 'text-welted-bg/60' : 'text-welted-text-muted'
                  }`}
                >
                  {formatTimeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-welted-bg border-t border-welted-border px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-welted-input-bg border border-welted-border rounded-full px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-welted-accent flex items-center justify-center text-welted-bg disabled:opacity-40 hover:bg-welted-accent-dim transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
