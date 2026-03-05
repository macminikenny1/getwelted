'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/lib/formatTime';
import type { Message, Conversation, Profile, BSTListing, Pair, TradeOffer } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import TradeOfferCard from '@/components/bst/TradeOfferCard';
import { ArrowLeft, Send, Package, ArrowLeftRight, DollarSign, CheckCircle2, Clock } from 'lucide-react';

interface ConversationDetail extends Conversation {
  bst_listings: Pick<BSTListing, 'id' | 'brand' | 'model' | 'image_urls' | 'status' | 'trade_interest' | 'pair_id' | 'buyer_id' | 'receipt_confirmed_at' | 'user_id'> | null;
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

  // Trade state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [myPairs, setMyPairs] = useState<Pair[]>([]);
  const [selectedTradePair, setSelectedTradePair] = useState<Pair | null>(null);
  const [proposingTrade, setProposingTrade] = useState(false);
  const [tradeActionLoading, setTradeActionLoading] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  // Payment info
  const [sellerPaymentInfo, setSellerPaymentInfo] = useState<{ venmo?: string; cashapp?: string; paypal?: string } | null>(null);

  // Receipt confirmation
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const supabase = createClient();

    // Fetch messages with trade_offer join
    const { data: msgs, error: msgsError } = await supabase
      .from('messages')
      .select('*, trade_offer:trade_offers(*, offered_pair:pairs(*))')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgsError) {
      console.error('Failed to load messages:', msgsError);
    } else {
      setMessages((msgs ?? []) as Message[]);
    }
  }, [conversationId]);

  // Load conversation and messages
  useEffect(() => {
    if (!user) return;

    async function load() {
      const supabase = createClient();

      // Load conversation with listing details
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .select(
          '*, bst_listings(id, brand, model, image_urls, status, trade_interest, pair_id, buyer_id, receipt_confirmed_at, user_id), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url, payment_info), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url, payment_info)'
        )
        .eq('id', conversationId)
        .single();

      if (convoError || !convo) {
        console.error('Failed to load conversation:', convoError);
        setLoading(false);
        return;
      }

      // Security: verify current user is a participant
      if (convo.buyer_id !== user!.id && convo.seller_id !== user!.id) {
        console.error('User is not a participant in this conversation');
        setLoading(false);
        return;
      }

      setConversation(convo as ConversationDetail);

      // Set seller payment info if listing is sold and current user is buyer
      const listing = (convo as any).bst_listings;
      if (listing?.status === 'sold' || listing?.status === 'pending_trade') {
        const seller = (convo as any).seller;
        if (seller?.payment_info && user!.id === convo.buyer_id) {
          setSellerPaymentInfo(seller.payment_info);
        }
      }

      // Check if user already left feedback for this listing
      if (listing?.id) {
        const { data: fb } = await supabase
          .from('feedback')
          .select('id')
          .eq('from_user_id', user!.id)
          .eq('listing_id', listing.id)
          .maybeSingle();
        if (fb) setHasFeedback(true);
      }

      // Load messages
      await fetchMessages();
      setLoading(false);
    }

    load();
  }, [conversationId, user, fetchMessages]);

  // Mark as read on mount
  useEffect(() => {
    if (!user || !conversation) return;
    const supabase = createClient();
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('target_id', conversationId)
      .in('type', ['message', 'trade_offer', 'trade_accepted'])
      .then(() => {});
  }, [user, conversation, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Subscribe to new messages
    const msgChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Re-fetch all messages to get joined trade_offer data
          fetchMessages();
        }
      )
      .subscribe();

    // Subscribe to trade offer updates
    const tradeChannel = supabase
      .channel(`trade_offers:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trade_offers',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [conversationId, user, fetchMessages]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;

    const body = text.trim();
    setText('');
    setSending(true);

    const supabase = createClient();

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
      setText(body);
      console.error(error);
    } else {
      await supabase
        .from('conversations')
        .update({
          last_message: body,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg as Message];
        });
      }

      // Create notification for the other user
      const otherUserId = conversation?.buyer_id === user.id
        ? conversation?.seller_id
        : conversation?.buyer_id;
      if (otherUserId) {
        await supabase.from('notifications').insert({
          user_id: otherUserId,
          type: 'message',
          actor_id: user.id,
          target_id: conversationId,
          target_type: 'conversation',
          body: body.length > 50 ? body.slice(0, 50) + '...' : body,
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

  // ─── Trade Functions ───────────────────────────

  const openTradeModal = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('pairs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'stored'])
      .order('created_at', { ascending: false });

    setMyPairs((data ?? []) as Pair[]);
    setSelectedTradePair(null);
    setTradeModalOpen(true);
  };

  const handleProposeTrade = async () => {
    if (!user || !selectedTradePair || !conversation?.bst_listings) return;

    setProposingTrade(true);
    const supabase = createClient();
    const listing = conversation.bst_listings;

    // Insert trade offer
    const { data: offer, error: offerError } = await supabase
      .from('trade_offers')
      .insert({
        conversation_id: conversationId,
        listing_id: listing.id,
        offered_pair_id: selectedTradePair.id,
        proposer_id: user.id,
        listing_owner_id: conversation.seller_id,
        status: 'pending',
      })
      .select()
      .single();

    if (offerError || !offer) {
      showToast('Failed to propose trade', 'error');
      console.error(offerError);
      setProposingTrade(false);
      return;
    }

    // Insert trade offer message
    const body = `Trade offer: ${selectedTradePair.brand} ${selectedTradePair.model} for your ${listing.brand} ${listing.model}`;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body,
      message_type: 'trade_offer',
      trade_offer_id: offer.id,
    });

    // Update conversation last message
    await supabase.from('conversations').update({
      last_message: body,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    // Create notification
    await supabase.from('notifications').insert({
      user_id: conversation.seller_id,
      type: 'trade_offer',
      actor_id: user.id,
      target_id: conversationId,
      target_type: 'conversation',
      body: `offered ${selectedTradePair.brand} ${selectedTradePair.model} for your ${listing.brand} ${listing.model}`,
    });

    showToast('Trade offer sent!');
    setTradeModalOpen(false);
    setProposingTrade(false);
    await fetchMessages();
  };

  const handleAcceptTrade = async (offerId: string) => {
    if (!user || !conversation?.bst_listings) return;
    setTradeActionLoading(true);
    const supabase = createClient();

    // Update trade offer status
    await supabase.from('trade_offers').update({ status: 'accepted' }).eq('id', offerId);

    // Set listing to pending_trade
    await supabase.from('bst_listings').update({ status: 'pending_trade' }).eq('id', conversation.bst_listings.id);

    // Get proposer_id from the offer
    const { data: offerData } = await supabase.from('trade_offers').select('proposer_id').eq('id', offerId).single();

    // Send notification to proposer
    if (offerData) {
      await supabase.from('notifications').insert({
        user_id: offerData.proposer_id,
        type: 'trade_accepted',
        actor_id: user.id,
        target_id: conversationId,
        target_type: 'conversation',
        body: `accepted your trade offer for ${conversation.bst_listings.brand} ${conversation.bst_listings.model}`,
      });
    }

    // Send system message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: 'Trade accepted! Both parties should ship their boots and confirm receipt here.',
    });

    await supabase.from('conversations').update({
      last_message: 'Trade accepted! Ship your boots.',
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    showToast('Trade accepted!');
    setTradeActionLoading(false);
    await fetchMessages();

    // Refresh conversation to get updated listing status
    const { data: refreshedConvo } = await supabase
      .from('conversations')
      .select('*, bst_listings(id, brand, model, image_urls, status, trade_interest, pair_id, buyer_id, receipt_confirmed_at, user_id), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url, payment_info), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url, payment_info)')
      .eq('id', conversationId)
      .single();
    if (refreshedConvo) setConversation(refreshedConvo as ConversationDetail);
  };

  const handleDeclineTrade = async (offerId: string) => {
    if (!user) return;
    setTradeActionLoading(true);
    const supabase = createClient();

    await supabase.from('trade_offers').update({ status: 'declined' }).eq('id', offerId);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: 'Trade offer declined.',
    });

    await supabase.from('conversations').update({
      last_message: 'Trade offer declined.',
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    showToast('Trade declined');
    setTradeActionLoading(false);
    await fetchMessages();
  };

  const handleRescindTrade = async (offerId: string) => {
    if (!user) return;
    setTradeActionLoading(true);
    const supabase = createClient();

    await supabase.from('trade_offers').update({ status: 'rescinded' }).eq('id', offerId);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: 'Trade offer rescinded.',
    });

    await supabase.from('conversations').update({
      last_message: 'Trade offer rescinded.',
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    showToast('Trade offer rescinded');
    setTradeActionLoading(false);
    await fetchMessages();
  };

  const handleTradeConfirmReceipt = async (offerId: string) => {
    if (!user) return;
    setTradeActionLoading(true);
    const supabase = createClient();

    // Get the full offer
    const { data: offer } = await supabase
      .from('trade_offers')
      .select('*, offered_pair:pairs(*)')
      .eq('id', offerId)
      .single();

    if (!offer) {
      showToast('Failed to load trade offer', 'error');
      setTradeActionLoading(false);
      return;
    }

    // Set the appropriate confirmed flag
    const isProposer = offer.proposer_id === user.id;
    const updateField = isProposer ? 'proposer_confirmed' : 'owner_confirmed';
    await supabase.from('trade_offers').update({ [updateField]: true }).eq('id', offerId);

    // Check if both parties have now confirmed
    const otherConfirmed = isProposer ? offer.owner_confirmed : offer.proposer_confirmed;

    if (otherConfirmed) {
      // Both confirmed — execute the trade!
      await executeTrade(offer);
    } else {
      // Only one party confirmed
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: 'I confirmed receipt of the boots!',
      });
      await supabase.from('conversations').update({
        last_message: 'Receipt confirmed by one party.',
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    }

    showToast('Receipt confirmed!');
    setTradeActionLoading(false);
    await fetchMessages();
  };

  const executeTrade = async (offer: any) => {
    const supabase = createClient();
    const listing = conversation?.bst_listings;
    if (!listing) return;

    // 1. Transfer offered pair to listing owner
    await supabase.from('pairs').update({ user_id: offer.listing_owner_id }).eq('id', offer.offered_pair_id);

    // 2. Transfer listing pair to proposer (or create one)
    if (listing.pair_id) {
      await supabase.from('pairs').update({ user_id: offer.proposer_id }).eq('id', listing.pair_id);
    } else {
      // Create a new pair in the proposer's collection from listing data
      const { data: listingData } = await supabase
        .from('bst_listings')
        .select('brand, model, size_us, width, condition, image_urls, description')
        .eq('id', listing.id)
        .single();

      if (listingData) {
        await supabase.from('pairs').insert({
          user_id: offer.proposer_id,
          brand: listingData.brand,
          model: listingData.model,
          size_us: listingData.size_us,
          width: listingData.width,
          condition: listingData.condition,
          notes: listingData.description,
          image_urls: listingData.image_urls || [],
          status: 'active',
          is_public: false,
          is_roughout: false,
          wear_count: 0,
        });
      }
    }

    // 3. Mark listing as sold
    await supabase.from('bst_listings').update({ status: 'sold', buyer_id: offer.proposer_id }).eq('id', listing.id);

    // 4. System message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user!.id,
      body: 'Trade complete! Both boots have been transferred to your collections.',
    });

    await supabase.from('conversations').update({
      last_message: 'Trade complete!',
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    // Refresh conversation
    const { data: refreshedConvo } = await supabase
      .from('conversations')
      .select('*, bst_listings(id, brand, model, image_urls, status, trade_interest, pair_id, buyer_id, receipt_confirmed_at, user_id), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url, payment_info), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url, payment_info)')
      .eq('id', conversationId)
      .single();
    if (refreshedConvo) setConversation(refreshedConvo as ConversationDetail);
  };

  // ─── Sale Receipt Confirmation ───────────────────

  const handleSaleReceiptConfirm = async () => {
    if (!user || !conversation?.bst_listings) return;
    setConfirmingReceipt(true);
    const supabase = createClient();
    const listing = conversation.bst_listings;

    // Update listing
    await supabase.from('bst_listings').update({
      receipt_confirmed_at: new Date().toISOString(),
    }).eq('id', listing.id);

    // Transfer the boot to buyer's collection
    if (listing.pair_id) {
      await supabase.from('pairs').update({ user_id: user.id }).eq('id', listing.pair_id);
    } else {
      // Create a new pair from the listing data
      const { data: listingData } = await supabase
        .from('bst_listings')
        .select('brand, model, size_us, width, condition, image_urls, description')
        .eq('id', listing.id)
        .single();

      if (listingData) {
        await supabase.from('pairs').insert({
          user_id: user.id,
          brand: listingData.brand,
          model: listingData.model,
          size_us: listingData.size_us,
          width: listingData.width,
          condition: listingData.condition,
          notes: listingData.description,
          image_urls: listingData.image_urls || [],
          status: 'active',
          is_public: false,
          is_roughout: false,
          wear_count: 0,
        });
      }
    }

    // Send system message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: 'I received the boots! Thanks for the smooth transaction.',
    });

    await supabase.from('conversations').update({
      last_message: 'Boots received!',
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    showToast('Receipt confirmed! Boots added to your collection.');
    setConfirmingReceipt(false);

    // Refresh conversation
    const { data: refreshedConvo } = await supabase
      .from('conversations')
      .select('*, bst_listings(id, brand, model, image_urls, status, trade_interest, pair_id, buyer_id, receipt_confirmed_at, user_id), buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url, payment_info), seller:profiles!conversations_seller_id_fkey(id, username, avatar_url, payment_info)')
      .eq('id', conversationId)
      .single();
    if (refreshedConvo) setConversation(refreshedConvo as ConversationDetail);
    await fetchMessages();
  };

  // ─── Render ────────────────────────────────────

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
  const listing = conversation.bst_listings;

  const isBuyerInConversation = conversation.buyer_id === user.id;
  const isSellerInConversation = conversation.seller_id === user.id;

  // Can propose trade: listing is active, has trade interest, user is the buyer (not seller)
  const canProposeTrade =
    listing?.status === 'active' &&
    listing?.trade_interest &&
    isBuyerInConversation;

  // Show receipt confirmation banner for buyer on sold listings (not trades)
  const showSaleReceiptBanner =
    listing?.status === 'sold' &&
    listing?.buyer_id === user.id &&
    !listing?.receipt_confirmed_at;

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
      {listing && (
        <div className="shrink-0 border-b border-welted-border">
          <Link
            href={`/bst/${listing.id}`}
            className="flex items-center gap-3 px-4 py-2.5 bg-welted-card hover:bg-welted-card-hover transition-colors"
          >
            {listingImage ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-welted-input-bg">
                <Image
                  src={imageSrc(listingImage)}
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
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-welted-text truncate">
                {listingLabel}
              </p>
              <p className="text-[11px] text-welted-text-muted">
                {listing.status === 'active' ? 'View listing' :
                 listing.status === 'sold' ? 'Sold' :
                 'Pending Trade'}
              </p>
            </div>
            {listing.status !== 'active' && (
              <Badge variant={listing.status === 'sold' ? 'danger' : 'accent'}>
                {listing.status === 'sold' ? 'Sold' : 'Pending'}
              </Badge>
            )}
          </Link>

          {/* Trade button */}
          {canProposeTrade && (
            <button
              onClick={openTradeModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-welted-accent/5 border-t border-welted-border text-welted-accent hover:bg-welted-accent/10 transition-colors"
            >
              <ArrowLeftRight size={16} />
              <span className="text-sm font-semibold">Propose Trade</span>
            </button>
          )}
        </div>
      )}

      {/* Payment Info Banner (shown to buyer after sale) */}
      {sellerPaymentInfo && listing?.status === 'sold' && isBuyerInConversation && (
        <div className="shrink-0 px-4 py-3 bg-welted-success/5 border-b border-welted-success/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-welted-success" />
            <span className="text-xs font-bold text-welted-success uppercase tracking-wider">Seller Payment Info</span>
          </div>
          <div className="space-y-1">
            {sellerPaymentInfo.venmo && (
              <p className="text-sm text-welted-text">
                <span className="text-welted-text-muted">Venmo:</span> {sellerPaymentInfo.venmo}
              </p>
            )}
            {sellerPaymentInfo.cashapp && (
              <p className="text-sm text-welted-text">
                <span className="text-welted-text-muted">Cash App:</span> {sellerPaymentInfo.cashapp}
              </p>
            )}
            {sellerPaymentInfo.paypal && (
              <p className="text-sm text-welted-text">
                <span className="text-welted-text-muted">PayPal:</span> {sellerPaymentInfo.paypal}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sale Receipt Confirmation Banner */}
      {showSaleReceiptBanner && (
        <div className="shrink-0 px-4 py-3 bg-welted-accent/5 border-b border-welted-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-welted-accent" />
              <span className="text-sm font-semibold text-welted-text">Did you receive the boots?</span>
            </div>
            <Button
              size="sm"
              onClick={handleSaleReceiptConfirm}
              disabled={confirmingReceipt}
            >
              {confirmingReceipt ? <Spinner size="sm" /> : <><CheckCircle2 size={14} className="mr-1" /> Confirm</>}
            </Button>
          </div>
        </div>
      )}

      {/* Sale receipt already confirmed banner */}
      {listing?.status === 'sold' && listing?.receipt_confirmed_at && (
        <div className="shrink-0 px-4 py-2 bg-welted-success/5 border-b border-welted-success/20 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-welted-success" />
          <span className="text-xs text-welted-success font-semibold">Receipt confirmed — boots transferred to buyer&apos;s collection</span>
        </div>
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

          // Render trade offer messages as cards
          if ((msg.message_type === 'trade_offer' || msg.type === 'trade_offer') && msg.trade_offer) {
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <TradeOfferCard
                  offer={msg.trade_offer}
                  currentUserId={user.id}
                  listingBrand={listing?.brand}
                  listingModel={listing?.model}
                  onAccept={handleAcceptTrade}
                  onDecline={handleDeclineTrade}
                  onRescind={handleRescindTrade}
                  onConfirmReceipt={handleTradeConfirmReceipt}
                  onLeaveFeedback={() => {
                    if (listing) {
                      const toUserId = user.id === msg.trade_offer!.proposer_id
                        ? msg.trade_offer!.listing_owner_id
                        : msg.trade_offer!.proposer_id;
                      router.push(`/bst/${listing.id}/feedback?toUserId=${toUserId}&role=${user.id === listing.user_id ? 'seller' : 'buyer'}`);
                    }
                  }}
                  hasFeedback={hasFeedback}
                  loading={tradeActionLoading}
                />
              </div>
            );
          }

          // Regular text messages
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

      {/* Trade Proposal Modal */}
      <Modal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        title="Propose a Trade"
      >
        <div className="space-y-4">
          <p className="text-sm text-welted-text-muted">
            Select a pair from your collection to offer for{' '}
            <span className="font-semibold text-welted-text">
              {listing?.brand} {listing?.model}
            </span>
          </p>

          {myPairs.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto text-welted-text-muted mb-3" />
              <p className="text-sm text-welted-text-muted">
                No pairs in your collection to offer.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => { setTradeModalOpen(false); router.push('/collection/new'); }}
              >
                Add a Pair
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {myPairs.map((pair) => {
                const isSelected = selectedTradePair?.id === pair.id;
                const pairImage = pair.image_urls?.[0];

                return (
                  <button
                    key={pair.id}
                    onClick={() => setSelectedTradePair(isSelected ? null : pair)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-welted-accent bg-welted-accent/5'
                        : 'border-welted-border bg-welted-card hover:border-welted-text-muted'
                    }`}
                  >
                    {pairImage ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-welted-input-bg">
                        <Image
                          src={imageSrc(pairImage)}
                          alt={`${pair.brand} ${pair.model}`}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-welted-input-bg flex items-center justify-center shrink-0">
                        <Package size={20} className="text-welted-text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs text-welted-text-muted uppercase tracking-wider font-semibold">
                        {pair.brand}
                      </p>
                      <p className="text-sm font-bold text-welted-text truncate">
                        {pair.model}
                      </p>
                      <p className="text-xs text-welted-text-muted">
                        {pair.size_us ? `US ${pair.size_us}` : ''}
                        {pair.width ? ` ${pair.width}` : ''}
                        {pair.condition ? ` · ${pair.condition}/10` : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={20} className="text-welted-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {myPairs.length > 0 && (
            <Button
              className="w-full"
              onClick={handleProposeTrade}
              disabled={!selectedTradePair || proposingTrade}
            >
              {proposingTrade ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Sending...
                </span>
              ) : (
                <>
                  <ArrowLeftRight size={16} className="mr-1.5" />
                  Send Trade Offer
                </>
              )}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
